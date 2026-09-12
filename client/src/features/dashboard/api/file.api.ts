import axios from "axios";
import { apiRequest } from "@/utils/api";
import { axiosInstance } from "@/utils/axiosInstance";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

interface PresignedUrlResponse {
  fileId: string;
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

const completeUploadApi = (fileId: string) =>
  apiRequest<CompleteUploadResponse>(
    "POST",
    `/files/upload/${fileId}/complete`,
  );

/**
 * Cancels an in-flight upload: deletes the partial S3 object + session.
 * The endpoint replies 204 with no body, so it bypasses the JSON envelope.
 */
const abortUploadApi = async (fileId: string): Promise<boolean> => {
  try {
    await axiosInstance.post(`/files/upload/${fileId}/abort`);
    return true;
  } catch {
    return false;
  }
};

/**
 * Best-effort abort that survives page teardown (tab close, refresh, SPA
 * navigation). Uses a keepalive request so the partial object is cleaned
 * even while the window is going away.
 */
const abortUploadsKeepalive = (fileIds: string[]) => {
  for (const fileId of fileIds) {
    const url = `${API_BASE}/api/v1/files/upload/${fileId}/abort`;

    fetch(url, {
      method: "POST",
      credentials: "include",
      keepalive: true,
    }).catch(() => {
      // The page is going away; nothing actionable here.
    });
  }
};

// ---------------------------------------------------------------------------
// Storage upload (presigned PUT)
// ---------------------------------------------------------------------------

export interface StorageUploadResult {
  success: boolean;
  canceled?: boolean;
  message?: string;
}

export interface StorageUploadProgress {
  loaded: number;
  total: number;
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
  opts?: {
    onProgress?: (p: StorageUploadProgress) => void;
    signal?: AbortSignal;
  },
): Promise<StorageUploadResult> => {
  const controller = new AbortController();
  const signal = opts?.signal ?? controller.signal;

  try {
    await axios.put(presignedUrl, file, {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      withCredentials: false,
      maxRedirects: 0,
      signal,
      onUploadProgress: (progressEvent) => {
        opts?.onProgress?.({
          loaded: progressEvent.loaded ?? 0,
          total: progressEvent.total ?? file.size,
        });
      },
    });

    return { success: true };
  } catch (error) {
    if (axios.isCancel(error)) {
      return { success: false, canceled: true, message: "Upload canceled" };
    }

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
// Retrieval URLs (presigned GET /files/:id[/preview|/download])
// ---------------------------------------------------------------------------

export interface PresignedAccessResponse {
  url: string;
  name: string;
  extension: string;
  mimeType: string;
  size: number;
}

/**
 * Fetches a presigned S3 link that renders the file inline
 * (an <img>/<video> src). The link points directly at the storage host.
 */
const getFileStreamUrl = async (fileId: string) =>
  apiRequest<PresignedAccessResponse>(
    "GET",
    `/files/${fileId}/preview`,
  );

/** Fetches a presigned S3 link that forces a download (attachment). */
const getFileDownloadUrl = async (fileId: string) =>
  apiRequest<PresignedAccessResponse>(
    "GET",
    `/files/${fileId}/download`,
  );

export {
  abortUploadApi,
  abortUploadsKeepalive,
  completeUploadApi,
  getFileDownloadUrl,
  getFileStreamUrl,
  getPresignedUrlApi,
  uploadFileToStorage,
};