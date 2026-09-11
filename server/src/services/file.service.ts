import { Types } from "mongoose";

import type { GetUploadPresignedUrlBody } from "../schemas/file.schema.js";

import {
  generatePresignedReadUrl,
  generatePresignedUploadUrl,
  getFileStorageKey,
  verifyUpload,
} from "../utils/awsS3.js";

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
  fileId: string;
}

interface GetFilePresignedAccessParameter {
  userId: string;
  fileId: string;
  disposition: "inline" | "attachment";
}

const getContentDisposition = (
  filename: string,
  type: "inline" | "attachment",
): string => {
  const asciiSafe = filename.replace(/[^\x20-\x7e]/g, "_");

  return `${type}; filename="${asciiSafe}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
};

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
  size,
  extension,
  mimeType,
  parentId,
}: GetUploadPresignedUrlParameter): Promise<{
  fileId: string;
  url: string;
}> => {
  const existingFolder = await Folder.findOne({
    _id: parentId,
    userId,
  })
    .select("_id")
    .lean();

  if (!existingFolder) {
    throw new ApiError(404, "Parent folder does not exist");
  }

  const fileId = new Types.ObjectId().toString();

  const url = await generatePresignedUploadUrl(fileId, mimeType);

  const cachedData: PendingUpload = {
    userId,
    parentId,
    name,
    extension,
    mimeType,
    expectedSize: size,
  };

  try {
    await redisSetJson(uploadIdKey(fileId), cachedData, ONE_HOUR);
  } catch {
    throw new ApiError(503, "Upload session store is unavailable");
  }

  return {
    fileId,
    url,
  };
};

const completeFileUpload = async ({
  userId,
  fileId,
}: CompleteFileUploadParameter): Promise<FileView> => {
  if (!Types.ObjectId.isValid(fileId)) {
    throw new ApiError(400, "Invalid file ID");
  }

  const redisKey = uploadIdKey(fileId);

  let cachedData: PendingUpload | null;

  try {
    cachedData = await redisGetJson<PendingUpload>(redisKey);
  } catch {
    throw new ApiError(503, "Upload session store is unavailable");
  }

  if (!cachedData) {
    throw new ApiError(400, "Upload session expired or invalid");
  }

  if (cachedData.userId !== userId) {
    throw new ApiError(403, "You can only complete your own uploads");
  }

  const existingFolder = await Folder.exists({
    _id: cachedData.parentId,
    userId,
  });

  if (!existingFolder) {
    throw new ApiError(404, "Parent folder no longer exists");
  }

  const entry = await verifyUpload(
    fileId,
    cachedData.expectedSize,
    cachedData.mimeType,
  );

  const file = await File.create({
    _id: new Types.ObjectId(fileId),
    name: cachedData.name,
    extension: cachedData.extension,
    size: entry.actualSize,
    mimeType: entry.mimeType,
    userId: new Types.ObjectId(userId),
    parentFolderId: new Types.ObjectId(cachedData.parentId),
  });

  try {
    await Promise.all([
      Folder.updateOne(
        {
          _id: cachedData.parentId,
          userId,
        },
        {
          $inc: {
            size: entry.actualSize,
          },
        },
      ),

      User.updateOne(
        {
          _id: userId,
        },
        {
          $inc: {
            storageUsed: entry.actualSize,
          },
        },
      ),
    ]);
  } catch (error) {
    await File.deleteOne({
      _id: file._id,
    });

    throw error;
  }

  // Redis is temporary state.
  // DB + S3 are already successful, so Redis cleanup
  // failure should not make the upload look failed.
  try {
    await redisDelete(redisKey);
  } catch (error) {
    console.error("Failed to delete pending upload from Redis:", {
      fileId,
      error,
    });
  }

  return toFileView(file);
};

const getFilePresignedAccess = async ({
  userId,
  fileId,
  disposition,
}: GetFilePresignedAccessParameter): Promise<{
  url: string;
  name: string;
  extension: string;
  mimeType: string;
  size: number;
}> => {
  if (!Types.ObjectId.isValid(fileId)) {
    throw new ApiError(400, "Invalid file ID");
  }

  const file = await File.findById(fileId)
    .select("name extension mimeType size userId")
    .lean();

  if (!file) {
    throw new ApiError(404, "File not found");
  }

  if (file.userId.toString() !== userId) {
    throw new ApiError(403, "You can only access your own files");
  }

  const key = getFileStorageKey(file._id.toString());

  const url = await generatePresignedReadUrl(key, {
    mimeType: file.mimeType || "application/octet-stream",
    contentDisposition: getContentDisposition(
      `${file.name}${file.extension}`,
      disposition,
    ),
  });

  return {
    url,
    name: file.name,
    extension: file.extension,
    mimeType: file.mimeType,
    size: file.size,
  };
};

export {
  getUploadPresignedUrl,
  completeFileUpload,
  getFilePresignedAccess,
};
