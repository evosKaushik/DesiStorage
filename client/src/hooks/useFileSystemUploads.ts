"use client";

import { useEffect, useRef } from "react";
import useFileSelectorFromDisk from "./useFileSelectorFromDisk";
import useFileSystemStore, {
  selectCurrentFolderId,
} from "@/store/useFileSystemStore";

/**
 * Drive upload flow (frontend-only for now).
 *
 * Opens the OS file picker via `useFileSelectorFromDisk`, then appends each
 * selected file into the filesystem store so the grid/list/recents UI updates
 * immediately — no server involved yet.
 */
export function useFileSystemUploads() {
  const addItem = useFileSystemStore((s) => s.addItem);
  const currentFolderId = useFileSystemStore(selectCurrentFolderId);

  const { openPicker, files, clearFiles } = useFileSelectorFromDisk({
    isSelectMultipleFiles: true,
    onlyImagePreview: false,
  });

  const appendedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (files.length === 0) return;

    // TODO(API): Replace this optimistic insert with the real upload call —
    // POST /files (multipart/form-data) → returns a ServerFileItem
    // (id, url, mimeType, size, updatedAt). Insert that payload instead.
    // For now we inject dummy FileItems (with a local blob preview URL) so
    // the grid/list/recents/details UI reflects the selection immediately.
    files.forEach((f) => {
      if (appendedIds.current.has(f.id)) return;
      appendedIds.current.add(f.id);

      // Create our own object URL (not the picker's preview) so it survives
      // `clearFiles()` below and stays valid for the whole session. TODO: on
      // real uploads the server URL replaces this, so nothing to revoke.
      addItem({
        id: f.id,
        name: f.name,
        type: "file",
        size: f.size,
        mimeType: f.type || "application/octet-stream",
        updatedAt: "Just now",
        parentId: currentFolderId,
        url: f.isPreviewAble ? URL.createObjectURL(f.file) : undefined,
        previewType: f.isPreviewAble ? f.previewType : undefined,
      });
    });

    clearFiles();
  }, [files, addItem, clearFiles, currentFolderId]);

  return { openPicker };
}