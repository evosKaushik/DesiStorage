import type { Readable } from "stream";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ApiError } from "../../utils/ApiError.js";
import { ENV } from "../../config/env.js";
import { ONE_HOUR } from "../../constants/constant.js";
import type {
  StorageDownload,
  StorageFileEntry,
  StoragePresignedUpload,
  StoragePresignInput,
  StorageProvider,
  StorageVerifyInput,
} from "../../types/storage.types.js";

const s3Client = new S3Client({
  region: ENV.AWS_REGION,
  credentials: {
    accessKeyId: ENV.AWS_ACCESS_KEY_ID,
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = ENV.AWS_BUCKET;
const PRESIGN_EXPIRES_SECONDS = ONE_HOUR;

const toApiError = (error: unknown, fallback: string): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    const name = error.name;

    if (name === "NotFound" || name === "NoSuchKey") {
      return new ApiError(404, "File not found in storage");
    }

    if (name === "Forbidden") {
      return new ApiError(502, "Storage access denied");
    }

    if (name === "NoSuchBucket") {
      return new ApiError(502, "Storage bucket not found");
    }
  }

  return new ApiError(502, fallback);
};

class AwsS3Provider implements StorageProvider {
  readonly name = "aws-s3";

  async generatePresignedUploadUrl(
    input: StoragePresignInput,
  ): Promise<StoragePresignedUpload> {
    const key = `uploads/${crypto.randomUUID()}-${input.filename}`;

    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: input.mimeType,
      });

      const url = await getSignedUrl(s3Client, command, {
        expiresIn: PRESIGN_EXPIRES_SECONDS,
      });

      return { url, key };
    } catch (error) {
      throw toApiError(error, "Storage failed to generate an upload link");
    }
  }

  async verifyUpload(
    input: StorageVerifyInput,
  ): Promise<StorageFileEntry> {
    try {
      const response = await s3Client.send(
        new HeadObjectCommand({ Bucket: BUCKET, Key: input.key }),
      );

      const actualSize = response.ContentLength;

      if (actualSize !== undefined && actualSize !== input.expectedSize) {
        throw new ApiError(
          400,
          `Uploaded file size mismatch: expected ${input.expectedSize} bytes, got ${actualSize} bytes`,
        );
      }

      const url = `https://${BUCKET}.s3.${ENV.AWS_REGION}.amazonaws.com/${input.key}`;

      return { key: input.key, url };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw toApiError(error, "Storage failed to verify the uploaded file");
    }
  }

  async createDownloadStream(key: string): Promise<StorageDownload> {
    try {
      const response = await s3Client.send(
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      );

      const stream = response.Body;

      if (!stream) {
        throw new ApiError(502, "Storage returned an empty file stream");
      }

      const contentLength = response.ContentLength;

      return {
        stream: stream as Readable,
        ...(typeof contentLength === "number"
          ? { contentLength }
          : {}),
      };
    } catch (error) {
      throw toApiError(error, "Storage failed to stream the file");
    }
  }
}

export const awsS3Provider = new AwsS3Provider();
