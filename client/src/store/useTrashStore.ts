import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import {
  deleteItemPermanentlyApi,
  deleteItemsPermanentlyApi,
  emptyTrashApi,
  getTrashedItemsApi,
  moveItemToTrashApi,
  restoreItemApi,
  restoreItemsBulkApi,
  type TrashItemKind,
} from "@/features/dashboard/api/trash.api";
import useFileSystemStore from "./useFileSystemStore";

export interface TrashedItem {
  id: string;
  kind: TrashItemKind;
  /** Full display name (files include their extension). */
  name: string;
  size: number;
  /** Files only; folders have no MIME type. */
  mimeType?: string;
  parentFolderId: string | null;
  /** Human-readable "deleted at" (the server surfaces it via `updatedAt`). */
  deletedAt: string;
}

interface TrashState {
  items: TrashedItem[];
  loading: boolean;
  fetchTrashed: () => Promise<void>;
  /** Moves a live file/folder to Trash, removing it from the active view. */
  moveToTrash: (itemId: string, kind: TrashItemKind) => Promise<boolean>;
  restoreItem: (itemId: string, kind: TrashItemKind) => Promise<boolean>;
  /** Restores several id-mixed file/folder items in one bulk call. */
  restoreMany: (itemIds: string[]) => Promise<boolean>;
  deletePermanently: (itemId: string) => Promise<boolean>;
  /** Permanently deletes several items in one bulk call. */
  deleteManyPermanently: (itemIds: string[]) => Promise<boolean>;
  emptyTrash: () => Promise<boolean>;
}

const toDisplayDate = (date: string): string => new Date(date).toLocaleString();

const useTrashStore = create<TrashState>()(
  immer((set) => ({
    items: [],
    loading: false,

    fetchTrashed: async () => {
      set((draft) => {
        draft.loading = true;
      });

      const result = await getTrashedItemsApi();

      set((draft) => {
        draft.loading = false;

        if (!result.success) return;

        const files: TrashedItem[] = result.data.files.map((file) => ({
          id: file.id,
          kind: "file",
          name: `${file.name}${file.extension}`,
          size: file.size,
          mimeType: file.mimeType,
          parentFolderId: file.parentFolderId,
          deletedAt: toDisplayDate(file.updatedAt),
        }));

        const folders: TrashedItem[] = result.data.folders.map((folder) => ({
          id: folder.id,
          kind: "folder",
          name: folder.name,
          size: folder.size,
          parentFolderId: folder.parentFolderId,
          deletedAt: toDisplayDate(folder.updatedAt),
        }));

        draft.items = [...files, ...folders];
      });
    },

    moveToTrash: async (itemId, kind) => {
      const result = await moveItemToTrashApi(itemId, kind);

      if (!result.success) return false;

      useFileSystemStore.getState().removeItem(itemId);

      set((draft) => {
        draft.items = draft.items.filter((item) => item.id !== itemId);
      });

      return true;
    },

    restoreItem: async (itemId, kind) => {
      const result = await restoreItemApi(itemId, kind);

      if (!result.success) return false;

      set((draft) => {
        draft.items = draft.items.filter((item) => item.id !== itemId);
      });

      return true;
    },

    restoreMany: async (itemIds) => {
      const ids = new Set(itemIds);
      const kinds: Record<string, TrashItemKind> = {};

      for (const item of useTrashStore.getState().items) {
        if (ids.has(item.id)) kinds[item.id] = item.kind;
      }

      const fileIds = itemIds.filter((id) => kinds[id] === "file");
      const folderIds = itemIds.filter((id) => kinds[id] === "folder");

      const result = await restoreItemsBulkApi({ fileIds, folderIds });

      if (!result.success) return false;

      set((draft) => {
        draft.items = draft.items.filter((item) => !ids.has(item.id));
      });

      return true;
    },

    deletePermanently: async (itemId) => {
      const result = await deleteItemPermanentlyApi(itemId);

      if (!result.success) return false;

      set((draft) => {
        draft.items = draft.items.filter((item) => item.id !== itemId);
      });

      return true;
    },

    deleteManyPermanently: async (itemIds) => {
      const result = await deleteItemsPermanentlyApi(itemIds);

      if (!result.success) return false;

      const ids = new Set(itemIds);

      set((draft) => {
        draft.items = draft.items.filter((item) => !ids.has(item.id));
      });

      return true;
    },

    emptyTrash: async () => {
      const result = await emptyTrashApi();

      if (!result.success) return false;

      set((draft) => {
        draft.items = [];
      });

      return true;
    },
  })),
);

export const selectTrashedItems = (state: TrashState) => state.items;

export default useTrashStore;