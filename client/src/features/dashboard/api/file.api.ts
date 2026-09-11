import axios from "axios";
import { apiRequest } from "@/utils/api";
import { axiosInstance } from "@/utils/axiosInstance";

interface PresignedUrlResponse {
  uploadId: string;
  url: string;
}

export interface PresignedUrlPayload {
  name: string;
  extension: string;
  size: number;
  mimeType: string;
  parentId: string;
}

export interface FileView {
  id: string;
  name: string;
  extension: string;
  size: number;
  mimeType: string;
  parentFolderId: string;
  createdAt: string;
  updatedAt: string;
}

interface CompleteUploadResponse {
  file: FileView;
}

const getPresignedUrlApi = (payload: PresignedUrlPayload) =>
  apiRequest<PresignedUrlResponse>("POST", "/files/upload", payload);

const completeUploadApi = (uploadId: string) =>
  apiRequest<CompleteUploadResponse>(
    "POST",
    `/files/upload/${uploadId}/complete`,
  );

// ---------------------------------------------------------------------------
// Storage upload (presigned PUT)
// ---------------------------------------------------------------------------

export interface StorageUploadResult {
  success: boolean;
  message?: string;
}

/**
 * PUTs the file bytes to the presigned URL issued by `POST /files/upload`.
 *
 * Goes DIRECTLY to the storage host (S3), so it must NOT go through
 * `axiosInstance` (that would leak our auth cookie/headers to the storage
 * provider) and must send exactly the headers the URL was signed for.
 */
const uploadFileToStorage = async (
  presignedUrl: string,
  file: globalThis.File,
): Promise<StorageUploadResult> => {
  try {
    await axios.put(presignedUrl, file, {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      withCredentials: false,
      maxRedirects: 0,
    });

    return { success: true };
  } catch (error) {
    let message = "The file failed to reach storage. Please try again.";

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      if (!error.response) {
        message = "Cannot reach the storage service. Check your connection.";
      } else if (status === 403) {
        message = "The upload link expired. Please try uploading again.";
      } else if (status === 413) {
        message = "The file is too large to upload.";
      } else if (status && status >= 500) {
        message = "The storage server had an error. Please try again later.";
      }
    }

    return { success: false, message };
  }
};

// ---------------------------------------------------------------------------
// Retrieval URLs (cookie-authenticated GET /files/:id[/preview|/download])
// ---------------------------------------------------------------------------

/**
 * Same-origin URL for streaming the file inline (e.g. as an <img>/<video> src).
 * Cookies are sent automatically for same-origin requests.
 */
const getFileStreamUrl = (fileId: string) =>
  `${axiosInstance.defaults.baseURL}/files/${fileId}/preview`;

/** Same-origin URL that forces a download (Content-Disposition: attachment). */
const getFileDownloadUrl = (fileId: string) =>
  `${axiosInstance.defaults.baseURL}/files/${fileId}/download`;

export {
  completeUploadApi,
  getFileDownloadUrl,
  getFileStreamUrl,
  getPresignedUrlApi,
  uploadFileToStorage,
};
