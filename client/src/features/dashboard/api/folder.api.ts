import { apiRequest, apiRequestNoContent } from "@/utils/api";

// ---------------------------------------------------------------------------
// DTOs returned by GET /folders/:folderId
// ---------------------------------------------------------------------------

export interface FolderSummaryDto {
  id: string;
  name: string;
  parentFolderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileSummaryDto {
  id: string;
  name: string;
  extension: string;
  size: number;
  parentFolderId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * The server stores the base name and extension separately
 * (e.g. `name: "report"`, `extension: ".pdf"`), matching the upload API.
 */
export interface GetFolderByIdResponse {
  folder: {
    id: string;
    name: string;
    parentFolderId: string | null;
  };
  folders: FolderSummaryDto[];
  files: FileSummaryDto[];
}

const getFolderByIdApi = (folderId: string) =>
  apiRequest<GetFolderByIdResponse>("GET", `/folders/${folderId}`);

/** Payload for `POST /folders`. `folderName` defaults to "New Folder". */
export interface CreateFolderPayload {
  /** Must be a real folder id (use `rootFolderId` for the root). */
  parentId: string;
  folderName?: string;
}

/** The created folder's id (name defaults server-side to "New Folder"). */
export interface CreatedFolderResponse {
  id: string;
}

const createFolderApi = (payload: CreateFolderPayload) =>
  apiRequest<CreatedFolderResponse>("POST", "/folders", payload);

/** Renames a folder. Replies `204 No Content`. */
const renameFolderApi = (folderId: string, name: string) =>
  apiRequestNoContent("PATCH", `/folders/${folderId}/name`, { name });

export { createFolderApi, getFolderByIdApi, renameFolderApi };