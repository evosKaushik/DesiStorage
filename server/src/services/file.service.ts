import type { Readable } from "stream";
import { Types } from "mongoose";
import type { GetUploadPresignedUrlBody } from "../schemas/file.schema.js";
import { getStorageProvider } from "./storage/index.js";
import { redisDelete, redisGetJson, redisSetJson } from "../utils/redis.js";
import { uploadIdKey } from "../utils/cacheKeys.js";
import { ONE_HOUR } from "../constants/constant.js";
import { ApiError } from "../utils/ApiError.js";
import Folder from "../models/folder.model.js";
import User from "../models/user.model.js";
import File from "../models/file.model.js";
import type { IFile } from "../models/file.model.js";
import type { PendingUpload } from "../types/file.types.js";

interface GetUploadPresignedUrlParameter extends GetUploadPresignedUrlBody {
  userId: string;
}

interface CompleteFileUploadParameter {
  userId: string;
  uploadId: string;
}

interface GetFileStreamParameter {
  userId: string;
  fileId: string;
}

export interface FileView {
  id: string;
  name: string;
  extension: string;
  size: number;
  mimeType: string;
  parentFolderId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileStreamData {
  fileName: string;
  mimeType: string;
  stream: Readable;
  contentLength?: string | number;
}

const toFileView = (file: IFile & { _id: Types.ObjectId }): FileView => ({
  id: file._id.toString(),
  name: file.name,
  extension: file.extension,
  size: file.size,
  mimeType: file.mimeType,
  parentFolderId: file.parentFolderId.toString(),
  createdAt: file.createdAt,
  updatedAt: file.updatedAt,
});

const getUploadPresignedUrl = async ({
  userId,
  name,
  extension,
  size,
  mimeType,
  parentId,
}: GetUploadPresignedUrlParameter): Promise<{
  uploadId: string;
  url: string;
}> => {
  const existingFolder = await Folder.findById(parentId);

  if (!existingFolder) {
    throw new ApiError(404, "Parent folder does not exist");
  }

  if (existingFolder.userId.toString() !== userId) {
    throw new ApiError(403, "You can only upload to your own folders");
  }

  const storage = getStorageProvider();

  const { url, key } = await storage.generatePresignedUploadUrl({
    filename: `${name}${extension}`,
    size,
    mimeType,
  });

  const uploadId = crypto.randomUUID();

  const cachedData: PendingUpload = {
    userId,
    key,
    name,
    extension,
    size,
    mimeType,
    parentId,
  };

  try {
    await redisSetJson(uploadIdKey(uploadId), cachedData, ONE_HOUR);
  } catch (error) {
    throw new ApiError(503, "Upload session store is unavailable");
  }

  return { uploadId, url };
};

const completeFileUpload = async ({
  userId,
  uploadId,
}: CompleteFileUploadParameter): Promise<FileView> => {
  const redisKey = uploadIdKey(uploadId);

  let cachedData: PendingUpload | null;

  try {
    cachedData = await redisGetJson<PendingUpload>(redisKey);
  } catch (error) {
    throw new ApiError(503, "Upload session store is unavailable");
  }

  if (!cachedData) {
    throw new ApiError(400, "Upload session expired or invalid");
  }

  if (cachedData.userId !== userId) {
    throw new ApiError(403, "You can only complete your own uploads");
  }

  if (!cachedData.extension) {
    throw new ApiError(400, "File must have an extension");
  }

  const existingFolder = await Folder.findById(cachedData.parentId);

  if (!existingFolder) {
    throw new ApiError(404, "Parent folder no longer exists");
  }

  if (existingFolder.userId.toString() !== userId) {
    throw new ApiError(403, "You can only complete uploads in your own folders");
  }

  const storage = getStorageProvider();

  const entry = await storage.verifyUpload({
    key: cachedData.key,
    expectedSize: cachedData.size,
  });

  const file = await File.create({
    name: cachedData.name,
    extension: cachedData.extension,
    size: cachedData.size,
    mimeType: cachedData.mimeType,
    userId: new Types.ObjectId(userId),
    parentFolderId: new Types.ObjectId(cachedData.parentId),
    storageKey: entry.key,
    storageUrl: entry.url,
  });

  try {
    await Folder.findByIdAndUpdate(cachedData.parentId, {
      $inc: { size: cachedData.size },
    });
    await User.findByIdAndUpdate(userId, {
      $inc: { storageUsed: cachedData.size },
    });
  } catch (error) {
    await File.deleteOne({ _id: file._id });
    throw error;
  }

  try {
    await redisDelete(redisKey);
  } catch (error) {
    throw new ApiError(503, "Upload session store is unavailable");
  }

  return toFileView(file);
};

const getFileStream = async ({
  userId,
  fileId,
}: GetFileStreamParameter): Promise<FileStreamData> => {
  const file = await File.findById(fileId).lean();

  if (!file) {
    throw new ApiError(404, "File not found");
  }

  if (file.userId.toString() !== userId) {
    throw new ApiError(403, "You can only access your own files");
  }

  // TODO: Integrate a CDN to offload file delivery and cache popular files,
  // so preview/download bypass the direct storage stream below.
  const storage = getStorageProvider();

  const download = await storage.createDownloadStream(file.storageKey);

  return {
    fileName: `${file.name}${file.extension}`,
    mimeType: file.mimeType || "application/octet-stream",
    stream: download.stream,
    ...(download.contentLength !== undefined
      ? { contentLength: download.contentLength }
      : {}),
  };
};

export {
  getUploadPresignedUrl,
  completeFileUpload,
  getFileStream,
};