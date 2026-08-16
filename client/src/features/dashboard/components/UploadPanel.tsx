import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  RotateCw,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatSize, useUploads } from "./UploadContext";


function iconFor(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) return ImageIcon;
  if (["mp4", "mov", "webm"].includes(ext)) return Film;
  if (["mp3", "wav", "m4a"].includes(ext)) return Music;
  if (["zip", "rar", "7z"].includes(ext)) return Archive;
  if (["xlsx", "csv", "numbers"].includes(ext)) return FileSpreadsheet;
  return FileText;
}

export function UploadPanel() {
  const {
    items,
    panelOpen,
    minimized,
    setMinimized,
    retry,
    cancel,
    remove,
    clearCompleted,
    closePanel,
  } = useUploads();

  if (!panelOpen || items.length === 0) return null;

  const active = items.filter((i) => i.status === "uploading" || i.status === "queued").length;
  const done = items.filter((i) => i.status === "done").length;
  const failed = items.filter((i) => i.status === "error").length;

  const heading =
    active > 0
      ? `Uploading ${active} item${active === 1 ? "" : "s"}`
      : failed > 0
        ? `${done} uploaded · ${failed} failed`
        : `${done} upload${done === 1 ? "" : "s"} complete`;

  return (
    <div className="fixed bottom-4 right-4 z-[70] w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl shadow-black/10 dark:shadow-black/40">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {active > 0 ? (
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
            onClick={() => setMinimized(!minimized)}
            aria-label={minimized ? "Expand" : "Minimize"}
          >
            {minimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={closePanel}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!minimized && (
        <>
          <ul className="max-h-[340px] overflow-y-auto py-1">
            {items.map((it) => {
              const Icon = iconFor(it.name);
              return (
                <li
                  key={it.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/40"
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      it.status === "error"
                        ? "bg-destructive/10 text-destructive"
                        : it.status === "done"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-primary/10 text-primary",
                    )}
                  >
                    {it.status === "done" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : it.status === "error" ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-medium">{it.name}</div>
                      <div className="shrink-0 text-[11px] text-muted-foreground">
                        {formatSize(it.size)}
                      </div>
                    </div>
                    {(it.status === "uploading" || it.status === "queued") && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <Progress value={it.progress} className="h-1 flex-1" />
                        <div className="w-20 text-right text-[10px] text-muted-foreground">
                          {it.status === "queued"
                            ? "Queued"
                            : `${Math.floor(it.progress)}% · ${it.speed ?? "—"}`}
                        </div>
                      </div>
                    )}
                    {it.status === "done" && (
                      <div className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                        Uploaded · Added to My Drive
                      </div>
                    )}
                    {it.status === "error" && (
                      <div className="mt-0.5 text-[11px] text-destructive">
                        {it.error ?? "Failed"}
                      </div>
                    )}
                    {it.status === "canceled" && (
                      <div className="mt-0.5 text-[11px] text-muted-foreground">Canceled</div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center">
                    {it.status === "error" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => retry(it.id)}
                        aria-label="Retry"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {it.status === "uploading" ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => cancel(it.id)}
                        aria-label="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => remove(it.id)}
                        aria-label="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {(done > 0 || items.some((i) => i.status === "canceled")) && (
            <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-4 py-2 text-xs">
              <span className="text-muted-foreground">
                {done} of {items.length} complete
              </span>
              <button
                onClick={clearCompleted}
                className="font-medium text-primary hover:underline"
              >
                Clear completed
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
