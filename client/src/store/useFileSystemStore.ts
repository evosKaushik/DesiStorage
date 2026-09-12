import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import { getFolderByIdApi } from "@/features/dashboard/api/folder.api";
import { mimeTypeFromExtension } from "@/lib/mime";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FilePreviewType =
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "text"
  | null;

export interface FileItem {
  id: string;
  name: string;
  type: "file";
  size: number;
  mimeType: string;
  updatedAt: string;
  parentId: string;
  url?: string;
  previewType?: FilePreviewType;
}

export interface FolderItem {
  id: string;
  name: string;
  parentId: string;
  type: "folder";
  updatedAt: string;
}

export type FileSystemItem = FileItem | FolderItem;

export interface FileSystemState {
  currentFolderId: string;
  items: FileSystemItem[];
  /** True while a folder's contents are being fetched from the server. */
  loadingFolder: boolean;

  setCurrentFolder: (folderId: string) => void;
  setItems: (items: FileSystemItem[]) => void;
  addItem: (item: FileSystemItem) => void;
  removeItem: (itemId: string) => void;
  updateItem: (
    itemId: string,
    patch: Partial<FileItem> | Partial<FolderItem>,
  ) => void;
  renameItemById: (itemId: string, newName: string) => void;
  getItemById: (itemId: string) => FileSystemItem | undefined;
  clearItems: () => void;
  /** Fetches a folder + its files from the API and replaces `items`. */
  loadFolder: (folderId: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectCurrentFolderId = (state: FileSystemState) =>
  state.currentFolderId;

export const selectItemById =
  (itemId: string) =>
  (state: FileSystemState): FileSystemItem | undefined =>
    state.items.find((item) => item.id === itemId);

export const renameItemById =
  (itemId: string, newName: string) =>
  (state: FileSystemState): FileSystemItem | undefined =>
    state.items.find((item) => item.id === itemId);

export const selectItems = (state: FileSystemState) => state.items;

export const selectFiles = (state: FileSystemState) =>
  state.items.filter((item): item is FileItem => item.type === "file");

export const selectFolders = (state: FileSystemState) =>
  state.items.filter((item): item is FolderItem => item.type === "folder");

export const selectItemCount = (state: FileSystemState) => state.items.length;

export const selectFileCount = (state: FileSystemState) =>
  state.items.filter((item) => item.type === "file").length;

export const selectFolderCount = (state: FileSystemState) =>
  state.items.filter((item) => item.type === "folder").length;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const toDisplayDate = (date: string): string =>
  new Date(date).toLocaleString();

const useFileSystemStore = create<FileSystemState>()(
  immer((set, get) => ({
    currentFolderId: "root",
    items: [],
    loadingFolder: false,

    setCurrentFolder: (folderId) =>
      set((draft) => {
        draft.currentFolderId = folderId;
        draft.items = [];
      }),

    setItems: (items) =>
      set((draft) => {
        draft.items = items;
      }),

    addItem: (item) =>
      set((draft) => {
        draft.items.push(item);
      }),

    removeItem: (itemId) =>
      set((draft) => {
        draft.items = draft.items.filter((item) => item.id !== itemId);
      }),

    getItemById: (itemId) => get().items.find((item) => item.id === itemId),

    renameItemById: (itemId, newName) =>
      set((draft) => {
        const item = draft.items.find((item) => item.id === itemId);
        if (item) {
          item.name = newName;
        }
      }),

    updateItem: (itemId, patch) =>
      set((draft) => {
        const item = draft.items.find((item) => item.id === itemId);

        if (!item) return;

        Object.assign(item, patch);
      }),

    clearItems: () =>
      set((draft) => {
        draft.items = [];
      }),

    loadFolder: async (folderId) => {
      set((draft) => {
        draft.currentFolderId = folderId;
        draft.loadingFolder = true;
        draft.items = [];
      });

      const result = await getFolderByIdApi(folderId);

      set((draft) => {
        draft.loadingFolder = false;

        if (!result.success) return;

        const { folders, files } = result.data;

        const folderItems: FileSystemItem[] = folders.map((folder) => ({
          id: folder.id,
          name: folder.name,
          parentId: folder.parentFolderId ?? "root",
          type: "folder",
          updatedAt: toDisplayDate(folder.updatedAt),
        }));

        const fileItems: FileSystemItem[] = files.map((file) => ({
          id: file.id,
          name: `${file.name}${file.extension}`,
          parentId: file.parentFolderId,
          type: "file",
          size: file.size,
          mimeType: mimeTypeFromExtension(file.extension),
          updatedAt: toDisplayDate(file.updatedAt),
          // Todo: Fetch a presigned URL via getFileStreamUrl(file.id)
          // and populate `url` + `previewType` for thumbnail previews.
        }));

        draft.items = [...folderItems, ...fileItems];
      });
    },
  })),
);

export default useFileSystemStore;
