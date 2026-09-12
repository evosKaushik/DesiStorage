"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronUp,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBytes } from "@/lib/format";
import { UploadDialog } from "./UploadDialog";
import { useUploads, formatEta } from "./UploadContext";

const ConfirmAbortDialog = () => {
  const { confirmOpen, confirmAbort, dismissConfirm } = useUploads();

  return (
    <Dialog open={confirmOpen} onOpenChange={(open) => !open && dismissConfirm()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Uploads in progress</DialogTitle>
          <DialogDescription>
            Closing now deletes the partially uploaded files. Choose Wait to
            keep uploading, or Cancel upload to stop and clean up.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={dismissConfirm}>
            Wait
          </Button>
          <Button variant="destructive" onClick={confirmAbort}>
            Cancel upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Bottom-right compact panel shown once the upload dialog is minimized. */
const CompactPanel = () => {
  const { items, setMinimized, closePanel } = useUploads();

  const active = items.filter(
    (item) => item.status === "uploading" || item.status === "queued",
  );
  const done = items.filter((item) => item.status === "done").length;
  const failed = items.filter((item) => item.status === "error").length;

  const totalBytes = items.reduce((sum, item) => sum + item.size, 0);
  const uploadedBytes = items.reduce((sum, item) => sum + item.uploaded, 0);
  const percent =
    totalBytes > 0 ? Math.min(100, (uploadedBytes / totalBytes) * 100) : 0;

  // Batch ETA from the active uploads' own average speeds.
  const started = items.filter((item) => item.status === "uploading");
  const totalBps = started.reduce((sum, item) => sum + (item.avgBps ?? 0), 0);
  const remainingBytes = started.reduce(
    (sum, item) => sum + Math.max(0, item.size - item.uploaded),
    0,
  );
  const batchEta =
    totalBps > 0 ? remainingBytes / totalBps : 0;
  const etaLabel = batchEta > 0 ? formatEta(batchEta) : null;

  const heading =
    active.length > 0
      ? `Uploading ${active.length} item${active.length === 1 ? "" : "s"}`
      : failed > 0
        ? `${done} uploaded · ${failed} failed`
        : `${done} upload${done === 1 ? "" : "s"} complete`;

  return (
    <div className="fixed bottom-4 right-4 z-[70] w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl shadow-black/10 dark:shadow-black/40">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {active.length > 0 ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          ) : failed > 0 ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          )}
          <div className="truncate text-sm font-semibold">{heading}</div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setMinimized(false)}
            aria-label="Expand upload dialog"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={closePanel}
            aria-label="Close (aborts active uploads)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 py-2.5 text-xs text-muted-foreground">
        <Progress value={percent} className="h-1 flex-1" />
        <span className="shrink-0 tabular-nums">
          {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
          {etaLabel && (
            <span className="pl-2 font-medium text-foreground/75">
              ~{etaLabel} left
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

export const UploadPanel = () => {
  const { items, panelOpen, minimized } = useUploads();

  if (!panelOpen || items.length === 0) return null;

  return (
    <>
      <ConfirmAbortDialog />
      {minimized ? <CompactPanel /> : <UploadDialog />}
    </>
  );
}