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

const FILES: FileSystemItem[] = [
  {
    id: "f1",
    name: "Q4-financials.xlsx",
    type: "file",
    size: 21842,
    updatedAt: "12 min ago",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    parentId: "root",
  },
  {
    id: "f2",
    name: "Kaushik Banner.png",
    type: "file",
    size: 4300800,
    updatedAt: "1h ago",
    mimeType: "image/png",
    parentId: "root",
  },
  {
    id: "f3",
    name: "Brand-guidelines.pdf",
    type: "file",
    size: 8700000,
    updatedAt: "3h ago",
    mimeType: "application/pdf",
    parentId: "root",
  },
  {
    id: "f4",
    name: "Onboarding-flow.mp4",
    type: "file",
    size: 84200000,
    updatedAt: "Yesterday",
    mimeType: "video/mp4",
    parentId: "root",
  },
  {
    id: "f5",
    name: "Investor-deck.pdf",
    type: "file",
    size: 12900000,
    updatedAt: "Yesterday",
    mimeType: "application/pdf",
    parentId: "root",
  },
  {
    id: "f6",
    name: "Podcast-episode-14",
    type: "folder",
    parentId: "root",
    updatedAt: "2d ago",
  },
  {
    id: "f7",
    name: "Website-assets.zip",
    type: "file",
    size: 212000000,
    updatedAt: "3d ago",
    mimeType: "application/zip",
    parentId: "root",
  },
  {
    id: "f8",
    name: "Meeting-notes",
    type: "folder",
    parentId: "root",
    updatedAt: "5d ago",
  },
];

const useFileSystemStore = create<FileSystemState>()(
  immer((set, get) => ({
    currentFolderId: "root",
    items: FILES,

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
