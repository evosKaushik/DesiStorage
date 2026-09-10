import {
  createFileEntry,
  generatePresignedUploadUrl,
  getFileDownloadStream,
} from "../../utils/spaceByteAPI.js";
import { ApiError } from "../../utils/ApiError.js";
import type {
  StorageDownload,
  StorageFileEntry,
  StoragePresignedUpload,
  StoragePresignInput,
  StorageProvider,
  StorageRegistrationPayload,
} from "../../types/storage.types.js";

class SpaceByteProvider implements StorageProvider {
  readonly name = "spacebyte";

  async generatePresignedUploadUrl(
    _input: StoragePresignInput,
  ): Promise<StoragePresignedUpload> {
    return generatePresignedUploadUrl();
  }

  async registerFile(
    payload: StorageRegistrationPayload,
  ): Promise<StorageFileEntry> {
    const entry = await createFileEntry(payload);

    if (!entry.hash) {
      throw new ApiError(502, "Storage did not return a file hash");
    }

    return { hash: entry.hash, url: entry.url };
  }

  async createDownloadStream(hash: string): Promise<StorageDownload> {
    const response = await getFileDownloadStream(hash);

    const contentLength = response.headers["content-length"];

    return {
      stream: response.data,
      ...(typeof contentLength === "string" || typeof contentLength === "number"
        ? { contentLength }
        : {}),
    };
  }
}

export const spaceByteProvider = new SpaceByteProvider();