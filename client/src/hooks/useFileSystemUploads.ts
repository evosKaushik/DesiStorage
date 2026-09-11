"use client";

import { useCallback, useEffect, useRef } from "react";

import useFileSelectorFromDisk, {
  type SelectedFile,
} from "./useFileSelectorFromDisk";
import useFileSystemStore, {
  selectCurrentFolderId,
} from "@/store/useFileSystemStore";
import useUserStore, { selectUser } from "@/store/useUserStore";

import {
  type FileView,
  type PresignedUrlPayload,
  completeUploadApi,
  getPresignedUrlApi,
  uploadFileToStorage,
} from "@/features/dashboard/api/file.api";

import { showToastWithDescription } from "@/components/ShowToastWithDescription";
import { getErrorMessage } from "@/utils/api";

/**
 * Uploads a file through the three-endpoint pipeline:
 *
 *  1. POST /files/upload       → presigned URL for the storage provider
 *  2. PUT  <presigned URL>     → file bytes straight to storage
 *  3. POST /files/upload/:id/complete → mark the upload as finished
 *
 * Each stage has its own error handling and toast so failures are clearly
 * surfaced in the UI. Files are added to the store optimistically for a
 * responsive preview and swapped for the real server entry on success.
 */
export function useFileSystemUploads() {
  const addItem = useFileSystemStore((s) => s.addItem);
  const removeItem = useFileSystemStore((s) => s.removeItem);
  const currentFolderId = useFileSystemStore(selectCurrentFolderId);
  const user = useUserStore(selectUser);

  const { openPicker, files, clearFiles } = useFileSelectorFromDisk({
    isSelectMultipleFiles: true,
    onlyImagePreview: false,
  });

  const processedIds = useRef<Set<string>>(new Set());

  /**
   * The parent folder to upload into. The store's `currentFolderId` is the
   * placeholder `"root"` until a folder is opened — in that case fall back to
   * the user's real root folder id from `GET /auth`.
   */
  const parentFolderId =
    currentFolderId === "root" ? user?.rootFolderId ?? null : currentFolderId;

  const uploadSingleFile = useCallback(
    async (selected: SelectedFile): Promise<FileView | null> => {
      const { file } = selected;

      if (!parentFolderId) {
        showToastWithDescription.warning({
          title: "Cannot upload",
          description: "Open a folder first, then upload to it.",
        });

        return null;
      }

      const dotIndex = file.name.lastIndexOf(".");

      if (dotIndex <= 0) {
        showToastWithDescription.warning({
          title: "Cannot upload",
          description: `"${file.name}" has no extension. Files need one (e.g. .png, .pdf).`,
        });

        return null;
      }

      const payload: PresignedUrlPayload = {
        name: file.name.slice(0, dotIndex),
        extension: file.name.slice(dotIndex).toLowerCase(),
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        parentId: parentFolderId,
      };

      const presigned = await getPresignedUrlApi(payload);

      if (!presigned.success) {
        showToastWithDescription.error({
          title: `Upload failed: ${file.name}`,
          description: getErrorMessage(presigned.error),
        });

        return null;
      }

      const { uploadId, url } = presigned.data;

      const uploadResult = await uploadFileToStorage(url, file);

      if (!uploadResult.success) {
        showToastWithDescription.error({
          title: `Upload failed: ${file.name}`,
          description: uploadResult.message || "Upload failed.",
        });

        return null;
      }

      const completed = await completeUploadApi(uploadId);

      if (!completed.success) {
        showToastWithDescription.error({
          title: `Upload failed: ${file.name}`,
          description: getErrorMessage(completed.error),
        });

        return null;
      }

      return completed.data.file;
    },
    [parentFolderId],
  );

  useEffect(() => {
    if (files.length === 0) return;

    const uploadFiles = async () => {
      for (const selected of files) {
        if (processedIds.current.has(selected.id)) continue;

        processedIds.current.add(selected.id);

        if (!parentFolderId) {
          showToastWithDescription.warning({
            title: "Cannot upload",
            description: "Open a folder first, then upload to it.",
          });

          continue;
        }

        // Temporary optimistic UI: show the file instantly with a local preview.
        const blobUrl = selected.isPreviewAble
          ? URL.createObjectURL(selected.file)
          : undefined;

        addItem({
          id: selected.id,
          name: selected.name,
          type: "file",
          size: selected.size,
          mimeType: selected.type || "application/octet-stream",
          updatedAt: "Uploading…",
          parentId: parentFolderId,
          url: blobUrl,
          previewType: selected.isPreviewAble
            ? selected.previewType
            : undefined,
        });

        const serverFile = await uploadSingleFile(selected);

        removeItem(selected.id);

        if (!serverFile) {
          if (blobUrl) URL.revokeObjectURL(blobUrl);

          continue;
        }

        addItem({
          id: serverFile.id,
          name: `${serverFile.name}${serverFile.extension}`,
          type: "file",
          size: serverFile.size,
          mimeType: serverFile.mimeType,
          updatedAt: new Date(serverFile.createdAt).toLocaleString(),
          parentId: parentFolderId,
          url: blobUrl,
          previewType: selected.isPreviewAble
            ? selected.previewType
            : undefined,
        });

        showToastWithDescription.success({
          title: "Upload complete",
          description: `${serverFile.name}${serverFile.extension} saved to this folder.`,
        });
      }

      clearFiles();
    };

    void uploadFiles();
  }, [files, addItem, clearFiles, parentFolderId, removeItem, uploadSingleFile]);

  return {
    openPicker,
  };
}