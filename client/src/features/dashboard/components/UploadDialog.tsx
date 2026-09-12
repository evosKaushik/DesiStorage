"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  X,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/format";
import { useUploads, type UploadItem } from "./UploadContext";

const iconFor = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";

  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext))
    return <ImageIcon className="h-5 w-5" />;
  if (["mp4", "mov", "webm"].includes(ext)) return <Film className="h-5 w-5" />;
  if (["mp3", "wav", "m4a"].includes(ext))
    return <Music className="h-5 w-5" />;
  if (["zip", "rar", "7z"].includes(ext))
    return <Archive className="h-5 w-5" />;
  if (["xlsx", "csv", "numbers"].includes(ext))
    return <FileSpreadsheet className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
}

const UploadRow = ({ item }: { item: UploadItem }) => {
  const { retry } = useUploads();
  const icon = iconFor(item.name);
  const remaining = Math.max(0, item.size - item.uploaded);
  const active = item.status === "uploading" || item.status === "queued";

  return (
    <li className="flex items-center gap-3 py-3">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          item.status === "error"
            ? "bg-destructive/10 text-destructive"
            : item.status === "done"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-primary/10 text-primary",
        )}
      >
        {item.status === "done" ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : item.status === "error" ? (
          <AlertCircle className="h-5 w-5" />
        ) : (
          icon
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="truncate text-sm font-medium">{item.name}</div>
          <div className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {active ? `${Math.floor(item.progress)}%` : formatBytes(item.size)}
          </div>
        </div>

        {active && (
          <>
            <div className="mt-1 text-[11px] tabular-nums text-muted-foreground">
              {formatBytes(item.uploaded)} of {formatBytes(item.size)} ·{" "}
              <span className="text-foreground/70">
                {formatBytes(remaining)} remaining
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <Progress value={item.progress} className="h-1.5 flex-1" />
              {item.status === "queued" ? (
                <div className="shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                  Waiting…
                </div>
              ) : (
                <div className="shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                  <div>
                    {Math.floor(item.progress)}% · {item.speed ?? "—"}
                  </div>
                  {item.etaText && (
                    <div className="font-medium text-primary">
                      ~{item.etaText} left
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {item.status === "done" && (
          <div className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
            Uploaded · Added to My Drive
          </div>
        )}
        {item.status === "error" && (
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-destructive">
            <span className="min-w-0 truncate">{item.error ?? "Failed"}</span>
            <button
              type="button"
              onClick={() => retry(item.id)}
              className="shrink-0 font-semibold underline underline-offset-2 hover:text-foreground"
            >
              Retry
            </button>
          </div>
        )}
        {item.status === "canceled" && (
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            Canceled
          </div>
        )}
      </div>
    </li>
  );
}

/** Centered dialog shown while uploads are running (until minimized). */
export const UploadDialog = () => {
  const { items, setMinimized, closePanel } = useUploads();

  const active = items.filter(
    (item) => item.status === "uploading" || item.status === "queued",
  ).length;
  const totalBytes = items.reduce((sum, item) => sum + item.size, 0);
  const uploadedBytes = items.reduce((sum, item) => sum + item.uploaded, 0);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        // ESC / backdrop collapse to the bottom-right panel instead of aborting.
        if (!open) setMinimized(true);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[min(70vh,34rem)] gap-4 overflow-hidden p-0 sm:max-w-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/40 px-5 py-4">
          <DialogTitle className="truncate text-base font-semibold">
            {active > 0
              ? `Uploading ${active} item${active === 1 ? "" : "s"}`
              : "Uploads"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Track upload progress, or minimize to keep working. Close aborts
            the uploads.
          </DialogDescription>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <span className="mr-2 text-xs tabular-nums text-muted-foreground">
              {formatBytes(uploadedBytes)} of {formatBytes(totalBytes)}
            </span>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setMinimized(true)}
              aria-label="Minimize upload dialog"
              title="Minimize"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={closePanel}
              aria-label="Close (aborts active uploads)"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ul className="max-h-[min(60vh,28rem)] overflow-y-auto px-5">
          {items.map((item) => {
            const isLast = items[items.length - 1].id === item.id;

            return (
              <div key={item.id} className={cn(!isLast && "border-b border-border/40")}>
                <UploadRow item={item} />
              </div>
            );
          })}
        </ul>

        <div className="flex items-center gap-2 border-t border-border/60 bg-muted/20 px-5 py-2.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Uploads continue while you work. Minimize to keep browsing.
        </div>
      </DialogContent>
    </Dialog>
  );
}