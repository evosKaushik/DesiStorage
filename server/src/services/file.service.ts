import { Types } from "mongoose";

import type { GetUploadPresignedUrlBody } from "../schemas/file.schema.js";

import {
  deleteFileObject,
  generatePresignedReadUrl,
  generatePresignedUploadUrl,
  getFileStorageKey,
  verifyUpload,
} from "../utils/awsS3.js";

import { redisGetDelJson, redisGetJson, redisSetJson } from "../utils/redis.js";

import { uploadAbortedKey, uploadIdKey } from "../utils/cacheKeys.js";
import { ONE_HOUR, fileBaseNameRegex } from "../constants/constant.js";
import { ApiError } from "../utils/ApiError.js";

import Folder from "../models/folder.model.js";
import User from "../models/user.model.js";
import File from "../models/file.model.js";

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

interface RenameFileParameter {
  userId: string;
  fileId: string;
  name: string;
}

interface AbortFileUploadParameter {
  userId: string;
  fileId: string;
}

const getContentDisposition = (
  filename: string,
  type: "inline" | "attachment",
): string => {
  const asciiSafe = filename.replace(/[^\x20-\x7e]/g, "_");

  return `${type}; filename="${asciiSafe}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
};

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
    deletedAt: null,
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
}: CompleteFileUploadParameter): Promise<void> => {
  if (!Types.ObjectId.isValid(fileId)) {
    throw new ApiError(400, "Invalid file ID");
  }

  const redisKey = uploadIdKey(fileId);

  let claimedData: PendingUpload | null;

  // GETDEL atomically claims the upload session so a concurrent abort
  // cannot clean up the object out from under a completing upload.
  try {
    claimedData = await redisGetDelJson<PendingUpload>(redisKey);
  } catch {
    throw new ApiError(503, "Upload session store is unavailable");
  }

  if (!claimedData) {
    throw new ApiError(400, "Upload session expired or invalid");
  }

  if (claimedData.userId !== userId) {
    await redisSetJson(redisKey, claimedData, ONE_HOUR);
    throw new ApiError(403, "You can only complete your own uploads");
  }

  const existingFolder = await Folder.exists({
    _id: claimedData.parentId,
    userId,
    deletedAt: null,
  });

  if (!existingFolder) {
    throw new ApiError(404, "Parent folder no longer exists");
  }

  let entry;
  try {
    entry = await verifyUpload(
      fileId,
      claimedData.expectedSize,
      claimedData.mimeType,
    );
  } catch (error) {
    await redisSetJson(redisKey, claimedData, ONE_HOUR);
    throw error;
  }

  const duplicate = await File.exists({
    userId,
    parentFolderId: claimedData.parentId,
    name: claimedData.name,
    extension: claimedData.extension,
    deletedAt: null,
  });

  if (duplicate) {
    await deleteFileObject(fileId);
    throw new ApiError(409, "A file with this name already exists in this folder");
  }

  await File.create({
    _id: new Types.ObjectId(fileId),
    name: claimedData.name,
    extension: claimedData.extension,
    size: entry.actualSize,
    mimeType: entry.mimeType,
    userId: new Types.ObjectId(userId),
    parentFolderId: new Types.ObjectId(claimedData.parentId),
  });

  try {
    await Promise.all([
      Folder.updateOne(
        {
          _id: claimedData.parentId,
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
      _id: fileId,
    });

    throw error;
  }

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

const renameFile = async ({
  userId,
  fileId,
  name,
}: RenameFileParameter): Promise<void> => {
  if (!Types.ObjectId.isValid(fileId)) {
    throw new ApiError(400, "Invalid file ID");
  }

  const dotIndex = name.lastIndexOf(".");
  if (dotIndex === -1) {
    throw new ApiError(400, "File name must include an extension");
  }

  const baseName = name.slice(0, dotIndex);
  const requestedExtension = name.slice(dotIndex).toLowerCase();

  if (!fileBaseNameRegex.test(baseName)) {
    throw new ApiError(400, "File name contains invalid characters");
  }

  const file = await File.findFileByOwner(
    new Types.ObjectId(userId),
    new Types.ObjectId(fileId),
  );

  if (!file) {
    throw new ApiError(404, "File not found");
  }

  if (file.deletedAt) {
    throw new ApiError(400, "Cannot rename a file in Trash");
  }

  if (requestedExtension !== file.extension.toLowerCase()) {
    throw new ApiError(400, "File extension cannot be changed");
  }

  const duplicateId = file._id as Types.ObjectId;

  const duplicate = await File.exists({
    _id: { $ne: duplicateId },
    userId: file.userId,
    parentFolderId: file.parentFolderId,
    name: baseName,
    extension: file.extension,
    deletedAt: null,
  });

  if (duplicate) {
    throw new ApiError(409, "A file with this name already exists");
  }

  const updatedFile = await File.findByIdAndUpdate(
    file._id,
    { name: baseName },
    { returnDocument: "after", runValidators: true },
  );

  if (!updatedFile) {
    throw new ApiError(404, "File not found");
  }

  return;
};

const resolveHandledUpload = async (
  userId: string,
  fileId: string,
): Promise<"aborted" | "completed" | "not-found"> => {
  let alreadyAborted: { abortedAt: number } | null = null;

  try {
    alreadyAborted = await redisGetJson<{ abortedAt: number }>(
      uploadAbortedKey(fileId),
    );
  } catch {
    throw new ApiError(503, "Upload session store is unavailable");
  }

  if (alreadyAborted) {
    return "aborted";
  }

  const completed = await File.exists({
    _id: new Types.ObjectId(fileId),
    userId,
  });

  if (completed) {
    return "completed";
  }

  return "not-found";
};

const abortFileUpload = async ({
  userId,
  fileId,
}: AbortFileUploadParameter): Promise<void> => {
  if (!Types.ObjectId.isValid(fileId)) {
    throw new ApiError(400, "Invalid file ID");
  }

  const redisKey = uploadIdKey(fileId);

  let existing: PendingUpload | null;

  try {
    existing = await redisGetJson<PendingUpload>(redisKey);
  } catch {
    throw new ApiError(503, "Upload session store is unavailable");
  }

  if (existing && existing.userId !== userId) {
    // Reveal nothing about uploads that are not owned by the caller.
    // A peek (not a claim) leaves a foreign session untouched.
    throw new ApiError(404, "Upload session not found or expired");
  }

  let claimed: PendingUpload | null;

  try {
    // GETDEL atomically claims the upload session so a concurrent
    // completion cannot finalize an object we are about to delete.
    claimed = await redisGetDelJson<PendingUpload>(redisKey);
  } catch {
    throw new ApiError(503, "Upload session store is unavailable");
  }

  if (!claimed) {
    const outcome = await resolveHandledUpload(userId, fileId);

    if (outcome === "aborted") {
      throw new ApiError(400, "Upload already aborted");
    }

    if (outcome === "completed") {
      throw new ApiError(409, "Upload already completed");
    }

    throw new ApiError(404, "Upload session not found or expired");
  }

  if (claimed.userId !== userId) {
    throw new ApiError(404, "Upload session not found or expired");
  }

  try {
    await deleteFileObject(fileId);
  } catch (error) {
    // The session was claimed, so restore it to allow a retry.
    try {
      await redisSetJson(redisKey, claimed, ONE_HOUR);
    } catch {
      // Restoring failed; surface the original storage error.
      console.error("Failed to restore pending upload after abort failure:", {
        fileId,
        error,
      });
    }

    throw error;
  }

  try {
    await redisSetJson(
      uploadAbortedKey(fileId),
      { abortedAt: Date.now() },
      ONE_HOUR,
    );
  } catch {
    throw new ApiError(503, "Upload session store is unavailable");
  }
};

export {
  getUploadPresignedUrl,
  completeFileUpload,
  getFilePresignedAccess,
  renameFile,
  abortFileUpload,
};
