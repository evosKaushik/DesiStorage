import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import {
  deleteFilePermanentlyApi,
  emptyTrashApi,
  getTrashedFilesApi,
  moveToTrashApi,
  restoreFileApi,
} from "@/features/dashboard/api/trash.api";
import useFileSystemStore from "./useFileSystemStore";

export interface TrashedFileItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  parentFolderId: string;
  /** Human-readable "deleted at" (the server surfaces it via `updatedAt`). */
  deletedAt: string;
}

interface TrashState {
  items: TrashedFileItem[];
  loading: boolean;
  fetchTrashed: () => Promise<void>;
  /** Moves a live file to Trash, removing it from the active folder view. */
  moveToTrash: (fileId: string) => Promise<boolean>;
  restoreItem: (fileId: string) => Promise<boolean>;
  deletePermanently: (fileId: string) => Promise<boolean>;
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

      const result = await getTrashedFilesApi();

      set((draft) => {
        draft.loading = false;

        if (!result.success) return;

        draft.items = result.data.files.map((file) => ({
          id: file.id,
          name: `${file.name}${file.extension}`,
          size: file.size,
          mimeType: file.mimeType,
          parentFolderId: file.parentFolderId,
          deletedAt: toDisplayDate(file.updatedAt),
        }));
      });
    },

    moveToTrash: async (fileId) => {
      const ok = await moveToTrashApi(fileId);

      if (!ok) return false;

      useFileSystemStore.getState().removeItem(fileId);

      set((draft) => {
        draft.items = draft.items.filter((item) => item.id !== fileId);
      });

      return true;
    },

    restoreItem: async (fileId) => {
      const ok = await restoreFileApi(fileId);

      if (!ok) return false;

      set((draft) => {
        draft.items = draft.items.filter((item) => item.id !== fileId);
      });

      return true;
    },

    deletePermanently: async (fileId) => {
      const ok = await deleteFilePermanentlyApi(fileId);

      if (!ok) return false;

      set((draft) => {
        draft.items = draft.items.filter((item) => item.id !== fileId);
      });

      return true;
    },

    emptyTrash: async () => {
      const ok = await emptyTrashApi();

      if (!ok) return false;

      set((draft) => {
        draft.items = [];
      });

      return true;
    },
  })),
);

export const selectTrashedItems = (state: TrashState) => state.items;

export default useTrashStore;