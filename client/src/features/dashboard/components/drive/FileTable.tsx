import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileItem } from "@/store/useFileSystemStore";
import { FILE_ICONS, colorFor, kindFromMimeType } from "./file-meta";
import { formatBytes } from "@/lib/format";
import { FilePreview } from "./FilePreview";

export function FileTable({
  files,
  selected,
  onSelect,
}: {
  files: FileItem[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <div className="grid grid-cols-[1fr_140px_120px_40px] gap-4 border-b border-border/60 bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <div>Name</div>
        <div>Modified</div>
        <div>Size</div>
        <div />
      </div>
      {files.map((f) => {
        const kind = kindFromMimeType(f.mimeType);
        const Icon = FILE_ICONS[kind];
        const active = selected === f.id;
        const showMediaPreview =
          f.url !== undefined &&
          (f.previewType === "image" || f.previewType === "video");
        return (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            className={cn(
              "grid w-full grid-cols-[1fr_140px_120px_40px] items-center gap-4 border-b border-border/40 px-4 py-2.5 text-left text-sm transition-colors last:border-0",
              active ? "bg-primary/5" : "hover:bg-accent/60",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg",
                  colorFor(kind),
                )}
              >
                <FilePreview
                  url={showMediaPreview ? f.url : undefined}
                  previewType={f.previewType}
                />
                {!showMediaPreview && <Icon className="h-4 w-4" />}
              </div>
              <span className="truncate font-medium">{f.name}</span>
            </div>
            <div className="text-muted-foreground ">{f.updatedAt}</div>
            <div className="text-muted-foreground">{formatBytes(f.size)}</div>
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        );
      })}
    </div>
  );
}
