import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

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



const useFileSystemStore = create<FileSystemState>()(
  immer((set, get) => ({
    currentFolderId: "root",
    items: [],

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
  })),
);

export default useFileSystemStore;
