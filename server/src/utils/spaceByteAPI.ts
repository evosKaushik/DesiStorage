import axios, { type AxiosResponse } from "axios";
import type { Readable } from "stream";
import { SPACE_BYTES_DEFAULT_API } from "../constants/constant.js";
import { ENV } from "../config/env.js";
import { ApiError } from "./ApiError.js";

const API_TOKEN = ENV.SPACE_BYTE_ACCESS_TOKEN;

// Axios Instance with API_TOKEN
const axiosInstance = axios.create({
  baseURL: SPACE_BYTES_DEFAULT_API,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_TOKEN}`,
  },
});

//=============================== Types ======================================

interface PresignedURLResponse {
  url: string;
  key: string;
  acl: string;
  status: string;
}

export type FileEntryType =
  "folder" | "image" | "text" | "audio" | "video" | "pdf";

export interface FileEntry {
  id: number;
  name: string;
  file_name: string;
  file_size: number;
  parent_id: number | null;
  parent: string | null;
  thumbnail: string | null;
  mime: string | null;
  url: string;
  hash: string | null;
  type: FileEntryType;
  description: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  path: string;
  users: {
    id: number;
    email: string;
  }[];
}

export interface GetFileEntriesParams {
  perPage?: number;
  deletedOnly?: boolean;
  starredOnly?: boolean;
  recentOnly?: boolean;
  sharedOnly?: boolean;
  query?: string;
  type?: FileEntryType;
  parentIds?: string[];
  workspaceId?: number;
}

export interface CreateFileEntryPayload {
  filename: string;
  clientName: string;
  size: number;
  clientMime: string;
  clientExtension: string;
  disk: string;
  parentId: number | null;
  relativePath: string;
}

export interface CreateFileEntryResponse {
  status: "success";
  fileEntry: FileEntry;
}

// ================================== Function ============================================

const toApiError = (error: unknown, fallback: string): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status;

    if (!error.response) {
      return new ApiError(503, "Storage service is unavailable");
    }

    if (statusCode && statusCode >= 500) {
      return new ApiError(502, "Storage service error");
    }

    if (statusCode && statusCode >= 400) {
      const data = error.response.data as { message?: string } | string;

      const detail =
        typeof data === "object" && data !== null && "message" in data
          ? data.message
          : undefined;

      return new ApiError(
        statusCode,
        detail && detail !== "Request failed with status code 422"
          ? detail
          : fallback,
      );
    }
  }

  return new ApiError(500, fallback);
};

const generatePresignedUploadUrl = async (): Promise<PresignedURLResponse> => {
  try {
    const { data } =
      await axiosInstance.post<PresignedURLResponse>("/s3/simple/presign");

    return data;
  } catch (error) {
    throw toApiError(error, "Storage failed to generate an upload link");
  }
};

const getFileEntries = async (
  params?: GetFileEntriesParams,
): Promise<FileEntry[]> => {
  const { data } = await axiosInstance.get<FileEntry[]>("/drive/file-entries", {
    params,
  });
  return data;
};

const createFileEntry = async (
  payload: CreateFileEntryPayload,
): Promise<FileEntry> => {
  try {
    const { data } = await axiosInstance.post<CreateFileEntryResponse>(
      "/s3/entries",
      payload,
    );

    if (!data.fileEntry?.hash) {
      throw new ApiError(502, "Storage did not return a file hash");
    }

    return data.fileEntry;
  } catch (error) {
    throw toApiError(error, "Storage failed to register the uploaded file");
  }
};

const getFileDownloadStream = async (
  hash: string,
): Promise<AxiosResponse<Readable>> => {
  if (!hash) {
    throw new ApiError(400, "Missing file hash");
  }

  try {
    const response = await axiosInstance.get(
      `/file-entries/download/${encodeURIComponent(hash)}`,
      {
        responseType: "stream",
        maxRedirects: 0,
        validateStatus: (status) => status === 200 || status === 302,
      },
    );

    if (response.status === 302) {
      const location = response.headers.location;

      if (typeof location !== "string" || location.length === 0) {
        throw new ApiError(
          502,
          "Storage download redirect is missing a location",
        );
      }

      return axios.get<Readable>(location, {
        responseType: "stream",
      });
    }

    return response;
  } catch (error) {
    throw toApiError(error, "Storage failed to stream the file download");
  }
};

export {
  generatePresignedUploadUrl,
  getFileEntries,
  createFileEntry,
  getFileDownloadStream,
};
