"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  abortUploadApi,
  abortUploadsKeepalive,
  completeUploadApi,
  getPresignedUrlApi,
  uploadFileToStorage,
  type StorageUploadProgress,
} from "../api/file.api";
import { getErrorMessage } from "@/utils/api";
import { showToastWithDescription } from "@/components/ShowToastWithDescription";
import useFileSystemStore from "@/store/useFileSystemStore";
import useUserStore from "@/store/useUserStore";

export type UploadStatus =
  | "queued"
  | "uploading"
  | "done"
  | "error"
  | "canceled";

export type UploadItem = {
  /** Client id; becomes the server `fileId` once the upload is presigned. */
  id: string;
  /** Full display name, including the extension. */
  name: string;
  size: number;
  /** Bytes pushed to storage so far. */
  uploaded: number;
  /** 0..100 percentage. */
  progress: number;
  status: UploadStatus;
  error?: string;
  /** Overall average upload speed, formatted (e.g. "259.6 KB/s"). */
  speed?: string;
  /** Remaining time estimate, formatted (e.g. "2m 30s"). */
  etaText?: string;
  /** Overall average speed in bytes/sec (numeric, for aggregations). */
  avgBps?: number;
  /** Remaining time estimate in seconds (numeric, for aggregations). */
  etaSec?: number;
  /** When the actual PUT to storage started (for average-speed math). */
  uploadStartedAt?: number;
  startedAt: number;
  /** Retained so the item can be retried. */
  file?: File;
  /** Server `fileId` (upload session) once created. */
  uploadId?: string;
};

const MAX_SIZE = 200 * 1024 * 1024;
const BLOCKED = ["exe", "bat", "sh", "dmg"];

type Ctx = {
  items: UploadItem[];
  panelOpen: boolean;
  minimized: boolean;
  setMinimized: (v: boolean) => void;
  openPicker: () => void;
  addFiles: (files: File[]) => void;
  retry: (id: string) => void;
  cancel: (id: string) => void;
  remove: (id: string) => void;
  clearCompleted: () => void;
  /** Close button. Prompts a Cancel/Wait dialog when uploads are active. */
  closePanel: () => void;
  /** Cancel/Wait confirmation dialog state. */
  confirmOpen: boolean;
  /** "Cancel upload": aborts every active upload and closes the dialog. */
  confirmAbort: () => void;
  /** "Wait": keep uploading, dismiss the confirmation. */
  dismissConfirm: () => void;
};

const UploadCtx = createContext<Ctx | null>(null);

const uid = () => {
  return Math.random().toString(36).slice(2, 10);
}

export const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const formatSpeed = (bytesPerSec: number) => `${formatSize(bytesPerSec)}/s`;

/** "~45s", "~2m 30s", "~12m" — the remaining-time estimate. */
export const formatEta = (seconds: number): string => {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))}s`;

  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);

  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
}

const extensionOf = (name: string) => {
  const index = name.lastIndexOf(".");

  if (index <= 0) return { base: name, extension: "" };

  return { base: name.slice(0, index), extension: name.slice(index) };
};

export const UploadProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [minimized, setMinimized] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const itemsRef = useRef<UploadItem[]>([]);
  const controllersRef = useRef<Map<string, AbortController>>(new Map());
  const cancelledRef = useRef<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragCounter = useRef(0);
  /** Tracks whether the current batch's end (toast + auto-close) was handled. */
  const settledHandledRef = useRef(false);
  const settleTimerRef = useRef<number | null>(null);

  const commit = useCallback((next: UploadItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const nowItem = useCallback((id: string) => {
    return itemsRef.current.find((item) => item.id === id);
  }, []);

  const patchItem = useCallback(
    (id: string, patch: Partial<UploadItem>) => {
      const next = itemsRef.current.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      );

      commit(next);
    },
    [commit],
  );

  const safeAbort = useCallback(async (uploadId?: string) => {
    if (!uploadId) return;
    try {
      await abortUploadApi(uploadId);
    } catch {
      // Cleanup is best-effort; the session expires on its own otherwise.
    }
  }, []);

  const resolveParentId = useCallback(() => {
    const { currentFolderId } = useFileSystemStore.getState();
    const rootFolderId = useUserStore.getState().user?.rootFolderId;

    if (currentFolderId && currentFolderId !== "root") {
      return currentFolderId;
    }

    return rootFolderId ?? currentFolderId;
  }, []);

  const uploadOne = useCallback(
    async (id: string) => {
      const item = nowItem(id);

      if (!item || item.status !== "queued") return;
      if (cancelledRef.current.has(id)) return;

      const file = item.file;
      const { base, extension } = extensionOf(item.name);

      if (!file) return;

      if (!extension) {
        patchItem(id, {
          status: "error",
          error: "Cannot upload a file without an extension",
        });
        return;
      }

      const parentId = resolveParentId();
      const uploadStartedAt = Date.now();

      patchItem(id, {
        status: "uploading",
        progress: 0,
        uploaded: 0,
        speed: undefined,
        etaText: undefined,
        avgBps: undefined,
        etaSec: undefined,
        uploadStartedAt,
      });

      // 1) Get a presigned URL for the server-managed upload session.
      const presign = await getPresignedUrlApi({
        name: base,
        extension,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        parentId,
      });

      if (cancelledRef.current.has(id)) return;

      if (!presign.success) {
        patchItem(id, { status: "error", error: getErrorMessage(presign.error) });
        return;
      }

      const uploadId = presign.data.fileId;
      const controller = new AbortController();

      controllersRef.current.set(id, controller);
      patchItem(id, { uploadId });

      // 2) PUT the bytes straight to storage, reporting live progress.
      // Speed is the OVERALL average (loaded / elapsed-since-start), which is
      // stable — instantaneous per-event deltas look noisy and misleading.
      const onProgress = (progress: StorageUploadProgress) => {
        const now = Date.now();
        const uploaded = Math.min(progress.loaded, item.size);
        const percent =
          item.size > 0 ? Math.min(100, (uploaded / item.size) * 100) : 0;

        const elapsedSeconds =
          Math.max(0, now - uploadStartedAt) / 1000;
        const avgBps = elapsedSeconds > 0 ? uploaded / elapsedSeconds : 0;
        const remaining = Math.max(0, item.size - uploaded);
        const etaSec = avgBps > 0 ? remaining / avgBps : 0;

        patchItem(id, {
          status: "uploading",
          uploaded,
          progress: percent,
          speed: avgBps > 0 ? formatSpeed(avgBps) : undefined,
          avgBps: avgBps > 0 ? avgBps : undefined,
          etaText: etaSec > 0 ? formatEta(etaSec) : undefined,
          etaSec: etaSec > 0 ? etaSec : undefined,
        });
      };

      const upload = await uploadFileToStorage(presign.data.url, file, {
        onProgress,
        signal: controller.signal,
      });

      controllersRef.current.delete(id);

      if (cancelledRef.current.has(id)) return;

      if (!upload.success) {
        if (upload.canceled) {
          patchItem(id, { status: "canceled" });
        } else {
          patchItem(id, { status: "error", error: upload.message });
        }
        // Remove the partial object so a retry starts clean.
        void safeAbort(uploadId);
        return;
      }

      patchItem(id, { uploaded: item.size, progress: 100 });

      // 3) Register the file server-side and surface it in the drive.
      const complete = await completeUploadApi(uploadId);

      if (cancelledRef.current.has(id)) return;

      if (!complete.success) {
        patchItem(id, { status: "error", error: complete.error.message });
        return;
      }

      const registered = complete.data.file;

      useFileSystemStore.getState().addItem({
        id: registered.id,
        name: `${registered.name}${registered.extension}`,
        type: "file",
        size: registered.size,
        mimeType: registered.mimeType,
        updatedAt: registered.updatedAt,
        parentId: registered.parentFolderId,
      });

      patchItem(id, {
        status: "done",
        progress: 100,
        speed: undefined,
        etaText: undefined,
        avgBps: undefined,
        etaSec: 0,
      });
    },
    [nowItem, patchItem, resolveParentId, safeAbort],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      if (!files.length) return;

      settledHandledRef.current = false;

      if (settleTimerRef.current) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }

      const created: UploadItem[] = files.map((file) => {
        const extension = extensionOf(file.name).extension;
        const blocked = BLOCKED.includes(extension.slice(1).toLowerCase());

        return {
          id: uid(),
          name: file.name,
          size: file.size,
          uploaded: 0,
          progress: 0,
          status: "queued",
          startedAt: Date.now(),
          file,
          ...(blocked
            ? { status: "error" as const, error: "Blocked file type" }
            : {}),
          ...(file.size > MAX_SIZE
            ? { status: "error" as const, error: "Exceeds 200 MB limit" }
            : {}),
        };
      });

      commit([...created, ...itemsRef.current]);
      setPanelOpen(true);
      setMinimized(false);

      created.forEach((item, index) => {
        if (item.status === "queued") {
          setTimeout(() => uploadOne(item.id), index * 150);
        }
      });
    },
    [commit, uploadOne],
  );

  const cancel = useCallback(
    (id: string) => {
      const item = nowItem(id);

      if (!item) return;
      if (item.status === "done" || item.status === "canceled") return;

      cancelledRef.current.add(id);

      const controller = controllersRef.current.get(id);

      if (controller) controller.abort();

      patchItem(id, { status: "canceled" });

      // A session already exists: tell the server to drop the partial
      // object. For queued items there is nothing to clean up server-side.
      if (item.uploadId) void safeAbort(item.uploadId);
    },
    [nowItem, patchItem, safeAbort],
  );

  const retry = useCallback(
    (id: string) => {
      const item = nowItem(id);

      if (!item) return;
      if (item.status !== "error" && item.status !== "canceled") return;

      settledHandledRef.current = false;

      if (settleTimerRef.current) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }

      const replacement: UploadItem = {
        ...item,
        id: uid(),
        uploadId: undefined,
        uploaded: 0,
        progress: 0,
        status: "queued",
        error: undefined,
        speed: undefined,
        startedAt: Date.now(),
      };

      commit(
        itemsRef.current
          .filter((entry) => entry.id !== id)
          .concat(replacement),
      );

      setTimeout(() => uploadOne(replacement.id), 0);
    },
    [commit, nowItem, uploadOne],
  );

  const remove = useCallback(
    (id: string) => {
      const next = itemsRef.current.filter((item) => item.id !== id);

      commit(next);

      if (next.length === 0) {
        setPanelOpen(false);
      }
    },
    [commit],
  );

  const clearCompleted = useCallback(() => {
    const next = itemsRef.current.filter(
      (item) => item.status !== "done" && item.status !== "canceled",
    );

    commit(next);

    if (next.length === 0) {
      setPanelOpen(false);
    }
  }, [commit]);

  const cancelAllActive = useCallback(() => {
    const actives = itemsRef.current.filter(
      (item) => item.status === "queued" || item.status === "uploading",
    );

    actives.forEach((item) => cancel(item.id));
  }, [cancel]);

  const closePanel = useCallback(() => {
    const anyActive = itemsRef.current.some(
      (item) => item.status === "queued" || item.status === "uploading",
    );

    if (anyActive) {
      setConfirmOpen(true);
      return;
    }

    commit([]);
    setPanelOpen(false);
  }, [commit]);

  const confirmAbort = useCallback(() => {
    setConfirmOpen(false);
    cancelAllActive();
    commit([]);
    setPanelOpen(false);
    setMinimized(false);
  }, [cancelAllActive, commit]);

  const dismissConfirm = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  // Mount hidden file input
  useEffect(() => {
    const el = document.createElement("input");

    el.type = "file";
    el.multiple = true;
    el.style.display = "none";
    el.addEventListener("change", () => {
      const files = el.files;

      if (files) {
        addFiles(Array.from(files));
      }
      el.value = "";
    });
    document.body.appendChild(el);
    inputRef.current = el;

    return () => {
      el.remove();
    };
  }, [addFiles]);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  // Global drag & drop
  useEffect(() => {
    const onDragEnter = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes("Files")) return;

      dragCounter.current += 1;
      setDragOver(true);
    };
    const onDragOver = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes("Files")) return;
      event.preventDefault();
    };
    const onDragLeave = () => {
      dragCounter.current = Math.max(0, dragCounter.current - 1);

      if (dragCounter.current === 0) setDragOver(false);
    };
    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      dragCounter.current = 0;
      setDragOver(false);

      const files = event.dataTransfer?.files;

      if (files && files.length) {
        addFiles(Array.from(files));
      }
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);

    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [addFiles]);

  // Capture every event that would abandon active uploads and clean up
  // the partial object server-side BEFORE the request dies.
  useEffect(() => {
    const activeIds = () =>
      itemsRef.current
        .filter(
          (item) => item.status === "queued" || item.status === "uploading",
        )
        .map((item) => item.uploadId)
        .filter((id): id is string => Boolean(id));

    const hasActive = () =>
      itemsRef.current.some(
        (item) => item.status === "queued" || item.status === "uploading",
      );

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      // Native leave prompt so the user knows uploads are in flight.
      // `returnValue` (not just preventDefault) is what modern browsers
      // require to actually show the confirmation dialog.
      if (hasActive() && activeIds().length) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    const onPageHide = () => {
      abortUploadsKeepalive(activeIds());
    };

    const onVisibilityHidden = () => {
      if (document.visibilityState === "hidden") {
        abortUploadsKeepalive(activeIds());
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityHidden);

    return () => {
      // Provider unmounted (e.g., left the dashboard) — fire a final,
      // teardown-safe abort for anything still in flight.
      abortUploadsKeepalive(activeIds());

      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityHidden);
    };
  }, []);

  // When every upload in the batch settles: no failures → toast + close the
  // dialog/panel; any failures → error toast and keep the dialog open to retry.
  useEffect(() => {
    const current = itemsRef.current;

    if (current.length === 0) return;

    const active = current.some(
      (item) => item.status === "queued" || item.status === "uploading",
    );
    const hasSettled = !active;

    if (!hasSettled) return;
    if (settledHandledRef.current) return;

    settledHandledRef.current = true;

    const done = current.filter((item) => item.status === "done").length;
    const failed = current.filter((item) => item.status === "error").length;

    if (failed === 0 && done === current.length) {
      showToastWithDescription.success({
        title: "Upload complete",
        description: `${done} file${done === 1 ? "" : "s"} uploaded to this folder.`,
      });

      // Brief pause so the user can register the done state, then close.
      settleTimerRef.current = window.setTimeout(() => {
        settleTimerRef.current = null;
        commit([]);
        setPanelOpen(false);
        setMinimized(false);
      }, 1000);

      return () => {
        if (settleTimerRef.current) {
          window.clearTimeout(settleTimerRef.current);
          settleTimerRef.current = null;
        }
      };
    }

    if (failed > 0) {
      showToastWithDescription.error({
        title: "Some uploads failed",
        description: `${failed} file${failed === 1 ? "" : "s"} didn't finish. Retry them below.`,
      });
    }
  }, [items, commit]);

  const value = useMemo<Ctx>(
    () => ({
      items,
      panelOpen,
      minimized,
      setMinimized,
      openPicker,
      addFiles,
      retry,
      cancel,
      remove,
      clearCompleted,
      closePanel,
      confirmOpen,
      confirmAbort,
      dismissConfirm,
    }),
    [
      items,
      panelOpen,
      minimized,
      openPicker,
      addFiles,
      retry,
      cancel,
      remove,
      clearCompleted,
      closePanel,
      confirmOpen,
      confirmAbort,
      dismissConfirm,
    ],
  );

  return (
    <UploadCtx.Provider value={value}>
      {children}
      {dragOver && (
        <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-primary/10 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-primary bg-background/95 px-10 py-8 text-center shadow-2xl">
            <div className="text-lg font-semibold text-foreground">
              Drop files to upload
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              They&apos;ll be added to your current folder
            </div>
          </div>
        </div>
      )}
    </UploadCtx.Provider>
  );
}

export const useUploads = () => {
  const ctx = useContext(UploadCtx);

  if (!ctx) throw new Error("useUploads must be inside UploadProvider");

  return ctx;
}