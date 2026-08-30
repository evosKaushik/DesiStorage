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


export type UploadStatus = "queued" | "uploading" | "done" | "error" | "canceled";
export type UploadItem = {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: UploadStatus;
  error?: string;
  speed?: string;
  startedAt: number;
};

const MAX_SIZE = 200 * 1024 * 1024;
const BLOCKED = ["exe", "bat", "sh", "dmg"];

type Ctx = {
  items: UploadItem[];
  panelOpen: boolean;
  minimized: boolean;
  setMinimized: (v: boolean) => void;
  openPicker: () => void;
  addFiles: (files: { name: string; size: number }[]) => void;
  retry: (id: string) => void;
  cancel: (id: string) => void;
  remove: (id: string) => void;
  clearCompleted: () => void;
  closePanel: () => void;
};

const UploadCtx = createContext<Ctx | null>(null);

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function UploadProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [minimized, setMinimized] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const timersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragCounter = useRef(0);

  const clearTimer = (id: string) => {
    const t = timersRef.current[id];
    if (t) {
      clearInterval(t);
      delete timersRef.current[id];
    }
  };

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearInterval);
      timersRef.current = {};
    };
  }, []);

  const startUpload = useCallback((item: UploadItem) => {
    const ext = item.name.split(".").pop()?.toLowerCase() ?? "";
    if (BLOCKED.includes(ext)) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "error", error: "Blocked file type" } : i,
        ),
      );
    //   toast.error(`Couldn't upload ${item.name}`, {
    //     description: "File type is not allowed.",
    //   });
      return;
    }
    if (item.size > MAX_SIZE) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "error", error: "Exceeds 200 MB limit" } : i,
        ),
      );
    //   toast.error(`Couldn't upload ${item.name}`, {
    //     description: "File exceeds the 200 MB limit.",
    //   });
      return;
    }

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: "uploading", progress: 0 } : i)),
    );

    const willFail = Math.random() < 0.12;
    const failAt = 30 + Math.floor(Math.random() * 50);
    const step = 4 + Math.random() * 8;

    const interval = setInterval(() => {
      setItems((prev) => {
        const current = prev.find((i) => i.id === item.id);
        if (!current || current.status !== "uploading") {
          clearTimer(item.id);
          return prev;
        }
        const next = Math.min(100, current.progress + step);
        if (willFail && next >= failAt) {
          clearTimer(item.id);
        //   toast.error(`Upload failed: ${item.name}`, {
        //     description: "Network interrupted. You can retry.",
        //   });
          return prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "error", error: "Network interrupted", progress: failAt }
              : i,
          );
        }
        if (next >= 100) {
          clearTimer(item.id);
        //   toast.success(`Uploaded ${item.name}`, {
        //     description: `${formatSize(item.size)} · Added to My Drive`,
        //   });
          return prev.map((i) =>
            i.id === item.id ? { ...i, status: "done", progress: 100, speed: undefined } : i,
          );
        }
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, progress: next, speed: `${(1.2 + Math.random() * 3).toFixed(1)} MB/s` }
            : i,
        );
      });
    }, 220);
    timersRef.current[item.id] = interval;
  }, []);

  const addFiles = useCallback(
    (incoming: { name: string; size: number }[]) => {
      if (!incoming.length) return;
      const created: UploadItem[] = incoming.map((f) => ({
        id: uid(),
        name: f.name,
        size: f.size,
        progress: 0,
        status: "queued",
        startedAt: Date.now(),
      }));
      setItems((prev) => [...created, ...prev]);
      setPanelOpen(true);
      setMinimized(false);
      created.forEach((it, idx) => {
        setTimeout(() => startUpload(it), idx * 180);
      });
    },
    [startUpload],
  );

  const retry = useCallback(
    (id: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.id === id);
        if (item) setTimeout(() => startUpload({ ...item, progress: 0 }), 0);
        return prev;
      });
    },
    [startUpload],
  );

  const cancel = (id: string) => {
    clearTimer(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: "canceled" } : i)));
    // toast.info("Upload canceled");
  };

  const remove = (id: string) => {
    clearTimer(id);
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      if (next.length === 0) setPanelOpen(false);
      return next;
    });
  };

  const clearCompleted = () =>
    setItems((prev) => {
      const next = prev.filter((i) => i.status !== "done" && i.status !== "canceled");
      if (next.length === 0) setPanelOpen(false);
      return next;
    });

  const closePanel = () => {
    const anyActive = items.some((i) => i.status === "uploading" || i.status === "queued");
    if (anyActive) {
    //   toast.warning("Uploads still in progress", {
    //     description: "Minimize instead, or cancel active uploads first.",
    //   });
      setMinimized(true);
      return;
    }
    setPanelOpen(false);
    setItems([]);
  };

  // Mount hidden file input
  useEffect(() => {
    const el = document.createElement("input");
    el.type = "file";
    el.multiple = true;
    el.style.display = "none";
    el.addEventListener("change", () => {
      const files = el.files;
      if (files) {
        addFiles(Array.from(files).map((f) => ({ name: f.name, size: f.size })));
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
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      dragCounter.current += 1;
      setDragOver(true);
    };
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      e.preventDefault();
    };
    const onDragLeave = () => {
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0) setDragOver(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragOver(false);
      const files = e.dataTransfer?.files;
      if (files && files.length) {
        addFiles(Array.from(files).map((f) => ({ name: f.name, size: f.size })));
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
    }),
    [items, panelOpen, minimized, openPicker, addFiles, retry],
  );

  return (
    <UploadCtx.Provider value={value}>
      {children}
      {dragOver && (
        <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-primary/10 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-primary bg-background/95 px-10 py-8 text-center shadow-2xl">
            <div className="text-lg font-semibold text-foreground">Drop files to upload</div>
            <div className="mt-1 text-sm text-muted-foreground">
              They&apos;ll be added to your current folder
            </div>
          </div>
        </div>
      )}
    </UploadCtx.Provider>
  );
}

export function useUploads() {
  const ctx = useContext(UploadCtx);
  if (!ctx) throw new Error("useUploads must be inside UploadProvider");
  return ctx;
}
