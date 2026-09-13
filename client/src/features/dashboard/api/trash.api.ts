import { apiRequest, apiRequestNoContent } from "@/utils/api";

// ---------------------------------------------------------------------------
// DTOs returned by GET /trash
// ---------------------------------------------------------------------------

export interface TrashedFileView {
  id: string;
  name: string;
  extension: string;
  size: number;
  mimeType: string;
  parentFolderId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrashedFolderView {
  id: string;
  name: string;
  size: number;
  parentFolderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrashedItemsResponse {
  files: TrashedFileView[];
  folders: TrashedFolderView[];
}

export type TrashItemKind = "file" | "folder";

/** Body shared by `POST /trash/bulk` and `POST /trash/restore/bulk`. */
export interface TrashBulkPayload {
  fileIds: string[];
  folderIds: string[];
}

/** Body for the permanent-delete route (`action=file|multiple`). */
export interface PermanentDeletePayload {
  itemIds: string[];
}

const itemQueryParam = (
  itemId: string,
  kind: TrashItemKind,
): Record<string, string> =>
  kind === "file" ? { fileId: itemId } : { folderId: itemId };

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/** Lists the caller's Trash: soft-deleted files and folders. */
const getTrashedItemsApi = () =>
  apiRequest<TrashedItemsResponse>("GET", "/trash");

// ---------------------------------------------------------------------------
// Mutations — every one of these replies `204 No Content`, so they never
// fetch a JSON payload back.
// ---------------------------------------------------------------------------

/**
 * Moves one live file/folder to Trash
 * (`POST /trash?fileId=…` / `POST /trash?folderId=…`).
 */
const moveItemToTrashApi = (itemId: string, kind: TrashItemKind) =>
  apiRequestNoContent(
    "POST",
    `/trash?${new URLSearchParams(itemQueryParam(itemId, kind)).toString()}`,
  );

/** Moves many files+folders (folder subtrees cascade) to Trash. */
const moveItemsToTrashBulkApi = (payload: TrashBulkPayload) =>
  apiRequestNoContent("POST", "/trash/bulk", payload);

/**
 * Restores one trashed file/folder back to its original location
 * (`POST /trash/restore?fileId=…` / `POST /trash/restore?folderId=…`).
 */
const restoreItemApi = (itemId: string, kind: TrashItemKind) =>
  apiRequestNoContent(
    "POST",
    `/trash/restore?${new URLSearchParams(itemQueryParam(itemId, kind)).toString()}`,
  );

/** Restores many files+folders (folder subtrees cascade) from Trash. */
const restoreItemsBulkApi = (payload: TrashBulkPayload) =>
  apiRequestNoContent("POST", "/trash/restore/bulk", payload);

/**
 * Permanently deletes a single item
 * (`DELETE /trash/permanent?action=file` with the id in the body).
 */
const deleteItemPermanentlyApi = (itemId: string) =>
  apiRequestNoContent("DELETE", "/trash/permanent?action=file", {
    itemIds: [itemId],
  });

/** Permanently deletes many items at once (`action=multiple`). */
const deleteItemsPermanentlyApi = (itemIds: string[]) =>
  apiRequestNoContent("DELETE", "/trash/permanent?action=multiple", {
    itemIds,
  });

/** Permanently deletes everything in the caller's Trash (`action=empty`). */
const emptyTrashApi = () =>
  apiRequestNoContent("DELETE", "/trash/permanent?action=empty");

export {
  deleteItemPermanentlyApi,
  deleteItemsPermanentlyApi,
  emptyTrashApi,
  getTrashedItemsApi,
  moveItemToTrashApi,
  moveItemsToTrashBulkApi,
  restoreItemApi,
  restoreItemsBulkApi,
};