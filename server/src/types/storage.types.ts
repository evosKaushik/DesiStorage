import type { Readable } from "stream";

export interface StoragePresignedUpload {
  url: string;
  key: string;
}

export interface StoragePresignInput {
  filename: string;
  size: number;
  mimeType: string;
}

export interface StorageVerifyInput {
  key: string;
  expectedSize: number;
}

export interface StorageFileEntry {
  key: string;
  url: string;
}

export interface StorageDownload {
  stream: Readable;
  contentLength?: string | number;
}

export interface StorageProvider {
  readonly name: string;
  generatePresignedUploadUrl(
    input: StoragePresignInput,
  ): Promise<StoragePresignedUpload>;
  verifyUpload(input: StorageVerifyInput): Promise<StorageFileEntry>;
  createDownloadStream(key: string): Promise<StorageDownload>;
}