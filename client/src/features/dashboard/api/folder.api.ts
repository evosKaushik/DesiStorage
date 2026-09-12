import { apiRequest } from "@/utils/api";

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

export { getFolderByIdApi };