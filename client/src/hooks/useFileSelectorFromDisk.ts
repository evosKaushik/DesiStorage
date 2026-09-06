import { useCallback, useEffect, useRef, useState } from "react";

interface UseFileSelectorOptions {
  isSelectMultipleFiles?: boolean;
  onlyImagePreview?: boolean;
}

export interface SelectedFile {
  id: string;

  // Original browser File
  file: globalThis.File;

  // Basic metadata
  name: string;
  size: number;
  type: string;
  lastModified: number;

  // Preview information
  preview: string | null;
  isPreviewAble: boolean;
  previewType: "image" | "video" | "audio" | "pdf" | "text" | null;
}

const PREVIEW_ABLE_TYPES = {
  image: /^image\//,
  video: /^video\//,
  audio: /^audio\//,
};

const getPreviewType = (
  file: globalThis.File
): SelectedFile["previewType"] => {
  if (PREVIEW_ABLE_TYPES.image.test(file.type)) {
    return "image";
  }

  if (PREVIEW_ABLE_TYPES.video.test(file.type)) {
    return "video";
  }

  if (PREVIEW_ABLE_TYPES.audio.test(file.type)) {
    return "audio";
  }

  if (file.type === "application/pdf") {
    return "pdf";
  }

  if (file.type.startsWith("text/")) {
    return "text";
  }

  return null;
};

const createFileId = (file: globalThis.File) => {
  return `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`;
};

const useFileSelectorFromDisk = ({
  isSelectMultipleFiles = false,
  onlyImagePreview = false,
}: UseFileSelectorOptions = {}) => {
  const [files, setFiles] = useState<SelectedFile[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Create preview for a file.
   *
   * Object URLs are much better for images/videos/audio
   * than converting the entire file into a base64 string.
   */
  const createPreview = useCallback(
    async (file: globalThis.File): Promise<{
      preview: string | null;
      isPreviewAble: boolean;
      previewType: SelectedFile["previewType"];
    }> => {
      const previewType = getPreviewType(file);

      // If only image preview is requested,
      // don't generate previews for other types.
      if (onlyImagePreview && previewType !== "image") {
        return {
          preview: null,
          isPreviewAble: false,
          previewType: null,
        };
      }

      /**
       * Browser can directly display these using an object URL.
       *
       * Example:
       * <img src={preview} />
       * <video src={preview} />
       * <audio src={preview} />
       */
      if (
        previewType === "image" ||
        previewType === "video" ||
        previewType === "audio" ||
        previewType === "pdf"
      ) {
        return {
          preview: URL.createObjectURL(file),
          isPreviewAble: true,
          previewType,
        };
      }

      /**
       * Text files can be read and previewed as text.
       */
      if (previewType === "text") {
        try {
          const text = await file.text();

          return {
            preview: text,
            isPreviewAble: true,
            previewType: "text",
          };
        } catch {
          return {
            preview: null,
            isPreviewAble: false,
            previewType: null,
          };
        }
      }

      return {
        preview: null,
        isPreviewAble: false,
        previewType: null,
      };
    },
    [onlyImagePreview]
  );

  const openPicker = useCallback(() => {
    /**
     * Reuse the same input element instead of creating
     * a new DOM element every time.
     */
    if (!inputRef.current) {
      const input = document.createElement("input");

      input.type = "file";
      input.style.display = "none";

      document.body.appendChild(input);

      inputRef.current = input;
    }

    const input = inputRef.current;

    input.multiple = isSelectMultipleFiles;

    // Allows selecting the same file again after removal/change.
    input.value = "";

    input.onchange = async () => {
      const selectedFiles = input.files;

      if (!selectedFiles || selectedFiles.length === 0) {
        return;
      }

      const fileArray = Array.from(selectedFiles);

      const normalizedFiles = await Promise.all(
        fileArray.map(async (file) => {
          const {
            preview,
            isPreviewAble,
            previewType,
          } = await createPreview(file);

          return {
            id: createFileId(file),

            file,

            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,

            preview,
            isPreviewAble,
            previewType,
          };
        })
      );

      setFiles((previousFiles) => {
        if (isSelectMultipleFiles) {
          return [...previousFiles, ...normalizedFiles];
        }

        return normalizedFiles;
      });
    };

    input.click();
  }, [createPreview, isSelectMultipleFiles]);

  /**
   * Remove a selected file.
   */
  const removeFile = useCallback((id: string) => {
    setFiles((previousFiles) => {
      const fileToRemove = previousFiles.find(
        (file) => file.id === id
      );

      /**
       * Object URLs consume browser memory.
       * Revoke them when no longer needed.
       */
      if (
        fileToRemove?.preview &&
        fileToRemove.preview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(fileToRemove.preview);
      }

      return previousFiles.filter((file) => file.id !== id);
    });
  }, []);

  /**
   * Clear everything.
   */
  const clearFiles = useCallback(() => {
    setFiles((previousFiles) => {
      previousFiles.forEach((file) => {
        if (
          file.preview &&
          file.preview.startsWith("blob:")
        ) {
          URL.revokeObjectURL(file.preview);
        }
      });

      return [];
    });
  }, []);

  /**
   * Cleanup when hook/component is destroyed.
   */
  useEffect(() => {
    return () => {
      if (inputRef.current) {
        inputRef.current.remove();
        inputRef.current = null;
      }

      setFiles((previousFiles) => {
        previousFiles.forEach((file) => {
          if (
            file.preview &&
            file.preview.startsWith("blob:")
          ) {
            URL.revokeObjectURL(file.preview);
          }
        });

        return [];
      });
    };
  }, []);

  return {
    openPicker,

    files,

    removeFile,

    clearFiles,

    /**
     * Convenient raw File[] for uploading.
     */
    rawFiles: files.map((item) => item.file),

    /**
     * Number of selected files.
     */
    fileCount: files.length,
  };
};

export default useFileSelectorFromDisk;

