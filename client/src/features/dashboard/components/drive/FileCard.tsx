import {
  MoreVertical,
  Trash2,
  InfoIcon,
  Folder,
  Share2,
  Pencil,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileItem } from "@/store/useFileSystemStore";
import {
  FILE_ICONS,
  colorFor,
  kindFromMimeType,
} from "./file-meta";
import { formatBytes } from "@/lib/format";
import FileItemContextMenu from "../FileItemContextMenu";
import { FilePreview } from "./FilePreview";

export function FileCard({
  file,
  layout = "grid",
  active,
  onClick,
}: {
  file: FileItem;
  layout?: "grid" | "row";
  active?: boolean;
  onClick?: () => void;
}) {
  const kind = kindFromMimeType(file.mimeType);
  const Icon = FILE_ICONS[kind];
  const showMediaPreview =
    file.url !== undefined &&
    (file.previewType === "image" || file.previewType === "video");

  if (layout === "row") {
    return (
      <article
        onClick={onClick}
        className={cn(
          "group flex justify-between md:grid w-full md:grid-cols-[1fr_140px_120px_40px] items-center gap-4 border-b border-border/40 px-4 py-2.5 text-left text-sm transition-colors last:border-0",
          active ? "bg-primary/5" : "hover:bg-accent/60",
          onClick && "cursor-pointer",
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
              url={showMediaPreview ? file.url : undefined}
              previewType={file.previewType}
            />
            {!showMediaPreview && <Icon className="h-4 w-4" />}
          </div>
          <span className="truncate font-medium">{file.name}</span>
        </div>
        <div className="text-muted-foreground hidden md:block">
          {file.updatedAt}
        </div>
        <div className="text-muted-foreground hidden md:block">
          {formatBytes(file.size)}
        </div>

        <FileItemContextMenu selectedItemId={file.id} selectedItemName={file.name} />
      </article>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-left transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none",
        active
          ? "border-primary/60 ring-2 ring-primary/20"
          : "border-border/60 hover:border-primary/40",
        onClick && "cursor-pointer",
      )}
    >
      <div className="relative flex h-28 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-muted/60 to-muted/20">
        <FilePreview
          url={showMediaPreview ? file.url : undefined}
          previewType={file.previewType}
        />
        {!showMediaPreview && (
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              colorFor(kind),
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="border-t border-border/60 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{file.name}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {formatBytes(file.size)} · {file.updatedAt}
            </div>
          </div>
          <div className="shrink-0 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            <FileItemContextMenu selectedItemId={file.id} selectedItemName={file.name}/>
          </div>
        </div>
      </div>
    </div>
  );
}