import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { ENV } from "../config/env.js";
import { ONE_HOUR } from "../constants/constant.js";
import { ApiError } from "./ApiError.js";

const s3Client = new S3Client({
  region: ENV.AWS_REGION,
  credentials: {
    accessKeyId: ENV.AWS_ACCESS_KEY_ID,
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = ENV.AWS_BUCKET;

const PRESIGN_EXPIRES_SECONDS = ONE_HOUR;

export type S3PresignedUpload = string;

export interface S3VerifyResult {
  key: string;
  actualSize: number;
  mimeType: string;
}

/**
 * Generates the S3 object key for a file.
 *
 * Keep this in one place so upload, verify, download,
 * and delete always use the same key.
 */
export const getFileStorageKey = (fileId: string): string => {
  return `files/${fileId}`;
};

const toApiError = (
  error: unknown,
  fallback: string,
): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    switch (error.name) {
      case "NotFound":
      case "NoSuchKey":
        return new ApiError(
          404,
          "File not found in storage",
        );

      case "Forbidden":
      case "AccessDenied":
        return new ApiError(
          502,
          "Storage access denied",
        );

      case "NoSuchBucket":
        return new ApiError(
          502,
          "Storage bucket not found",
        );
    }
  }

  return new ApiError(502, fallback);
};

export const generatePresignedUploadUrl = async (
  fileId: string,
  mimeType: string,
): Promise<S3PresignedUpload> => {
  try {
    const key = getFileStorageKey(fileId);

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: mimeType,
    });

    return await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGN_EXPIRES_SECONDS,
    });
  } catch (error) {
    throw toApiError(
      error,
      "Storage failed to generate an upload link",
    );
  }
};

export const verifyUpload = async (
  fileId: string,
  expectedSize: number,
  expectedMimeType: string,
): Promise<S3VerifyResult> => {
  const key = getFileStorageKey(fileId);

  try {
    const response = await s3Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
    );

    const actualSize = response.ContentLength;

    if (actualSize === undefined) {
      throw new ApiError(
        502,
        "Unable to verify uploaded file size",
      );
    }

    if (actualSize !== expectedSize) {
      await deleteObjectSafely(key);

      throw new ApiError(
        400,
        `Uploaded file size mismatch: expected ${expectedSize} bytes, got ${actualSize} bytes`,
      );
    }

    const mimeType = response.ContentType;

    if (!mimeType) {
      await deleteObjectSafely(key);

      throw new ApiError(
        400,
        "Unable to verify uploaded file type",
      );
    }

    if (mimeType !== expectedMimeType) {
      await deleteObjectSafely(key);

      throw new ApiError(
        400,
        "Uploaded file type does not match the requested file type",
      );
    }

    return {
      key,
      actualSize,
      mimeType,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw toApiError(
      error,
      "Storage failed to verify the uploaded file",
    );
  }
};

export const deleteObjectSafely = async (
  key: string,
): Promise<void> => {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
    );
  } catch (error) {
    // IMPORTANT:
    // Do not replace the original upload error.
    // Log this error and clean up later if necessary.
    console.error("Failed to delete S3 object:", {
      key,
      error,
    });
  }
};

/**
 * Deletes the S3 object for a file (idempotent for missing keys) and
 * throws a mapped ApiError when the storage provider cannot be reached.
 * Used when the caller must know whether cleanup actually succeeded.
 */
export const deleteFileObject = async (fileId: string): Promise<void> => {
  const key = getFileStorageKey(fileId);

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
    );
  } catch (error) {
    throw toApiError(error, "Storage failed to delete the uploaded file");
  }
};

export interface S3PresignedReadOptions {
  mimeType: string;
  contentDisposition: string;
}

export const generatePresignedReadUrl = async (
  key: string,
  options: S3PresignedReadOptions,
): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentType: options.mimeType,
      ResponseContentDisposition: options.contentDisposition,
    });

    return await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGN_EXPIRES_SECONDS,
    });
  } catch (error) {
    throw toApiError(
      error,
      "Storage failed to generate a file link",
    );
  }
};