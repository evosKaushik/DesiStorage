import type { Readable } from "stream";

export interface StoragePresignedUpload {
  url: string;
  key: string;
  acl: string;
}

export interface StoragePresignInput {
  filename: string;
  size: number;
  mimeType: string;
}

export interface StorageRegistrationPayload {
  filename: string;
  clientName: string;
  size: number;
  clientMime: string;
  clientExtension: string;
  disk: string;
  parentId: number | null;
  relativePath: string;
}

export interface StorageFileEntry {
  hash: string;
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
  registerFile(
    payload: StorageRegistrationPayload,
  ): Promise<StorageFileEntry>;
  createDownloadStream(hash: string): Promise<StorageDownload>;
}