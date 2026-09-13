import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import {
  createFolderApi,
  getFolderByIdApi,
  renameFolderApi,
} from "@/features/dashboard/api/folder.api";
import { renameFileApi } from "@/features/dashboard/api/file.api";
import { mimeTypeFromExtension } from "@/lib/mime";
import useUserStore from "./useUserStore";

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

export interface Crumb {
  id: string;
  name: string;
}

export interface FileSystemState {
  currentFolderId: string;
  items: FileSystemItem[];
  /** Path from the user's root folder down to `currentFolderId`. */
  folderTrail: Crumb[];
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
  /** Renames via the API (file keeps its extension) and syncs the store. */
  renameItem: (
    itemId: string,
    newName: string,
    kind: "file" | "folder",
  ) => Promise<boolean>;
  /** Creates a subfolder in the current folder and adds it to the view. */
  createFolder: (folderName?: string) => Promise<boolean>;
  getItemById: (itemId: string) => FileSystemItem | undefined;
  clearItems: () => void;
  /** Fetches a folder + its files from the API and replaces `items`. */
  loadFolder: (folderId: string) => Promise<void>;
  /** Opens a folder (double-click), extending the breadcrumb trail. */
  openFolder: (folderId: string, folderName: string) => Promise<void>;
  /** Navigates one level up (parent folder / root). */
  goUp: () => Promise<void>;
  /** Jumps to a breadcrumb trail entry (and truncates the rest). */
  goToCrumb: (index: number) => Promise<void>;
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

/** Breadcrumb path (root → current folder). */
export const selectFolderTrail = (state: FileSystemState) => state.folderTrail;

export const selectLoadingFolder = (state: FileSystemState) =>
  state.loadingFolder;

/** Name of the folder currently open in My Drive. */
export const selectCurrentFolderName = (state: FileSystemState) =>
  state.folderTrail[state.folderTrail.length - 1]?.name ?? "My Drive";

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
    folderTrail: [],
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

    renameItem: async (itemId, newName, kind) => {
      const result =
        kind === "file"
          ? await renameFileApi(itemId, newName)
          : await renameFolderApi(itemId, newName);

      if (!result.success) return false;

      set((draft) => {
        const item = draft.items.find((item) => item.id === itemId);
        if (item) {
          item.name = newName;
        }
      });

      return true;
    },

    createFolder: async (folderName) => {
      const { currentFolderId } = get();
      const rootFolderId = useUserStore.getState().user?.rootFolderId;

      const parentId =
        currentFolderId && currentFolderId !== "root"
          ? currentFolderId
          : rootFolderId ?? currentFolderId;

      const result = await createFolderApi({
        parentId,
        ...(folderName ? { folderName } : {}),
      });

      if (!result.success) return false;

      set((draft) => {
        draft.items.push({
          id: result.data.id,
          name: folderName || "New Folder",
          parentId: parentId === "root" ? "root" : parentId,
          type: "folder",
          updatedAt: new Date().toLocaleString(),
        });
      });

      return true;
    },

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
      const rootId = useUserStore.getState().user?.rootFolderId;

      set((draft) => {
        draft.currentFolderId = folderId;
        draft.loadingFolder = true;
        draft.items = [];

        // Loading the user's root (initial load, "home" jump, tab switch)
        // resets the breadcrumb to just the root folder.
        if (rootId && folderId === rootId) {
          draft.folderTrail = [{ id: rootId, name: "My Drive" }];
        }
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

    openFolder: async (folderId, folderName) => {
      set((draft) => {
        if (!draft.folderTrail.some((crumb) => crumb.id === folderId)) {
          draft.folderTrail.push({ id: folderId, name: folderName });
        }
      });

      await get().loadFolder(folderId);
    },

    goUp: async () => {
      const trail = get().folderTrail;
      const rootId = useUserStore.getState().user?.rootFolderId;

      if (trail.length <= 1) {
        if (rootId) await get().loadFolder(rootId);
        return;
      }

      const parent = trail[trail.length - 2];
      set((draft) => {
        draft.folderTrail = draft.folderTrail.slice(0, -1);
      });
      await get().loadFolder(parent.id);
    },

    goToCrumb: async (index) => {
      const trail = get().folderTrail;
      if (index < 0 || index >= trail.length) return;

      const target = trail[index];
      set((draft) => {
        draft.folderTrail = draft.folderTrail.slice(0, index + 1);
      });
      await get().loadFolder(target.id);
    },
  })),
);

export default useFileSystemStore;
