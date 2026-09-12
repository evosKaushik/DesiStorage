"use client";

import {
  Archive,
  FileSpreadsheet,
  FileText,
  Film,
  Folder,
  Image as ImageIcon,
  Music,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/format";
import type { FileSystemItem } from "@/store/useFileSystemStore";
import { colorFor, kindFromMimeType } from "./file-meta";
import FileItemContextMenu from "../FileItemContextMenu";
import { FilePreview } from "./FilePreview";
import { useFilePreview } from "../FilePreviewModel";
import { OwnerAvatar } from "./OwnerAvatar";

const fileIconFor = (mimeType: string, className: string) => {
  const kind = kindFromMimeType(mimeType);

  switch (kind) {
    case "image":
      return <ImageIcon className={className} />;
    case "sheet":
      return <FileSpreadsheet className={className} />;
    case "video":
      return <Film className={className} />;
    case "audio":
      return <Music className={className} />;
    case "zip":
      return <Archive className={className} />;
    default:
      return <FileText className={className} />;
  }
};

type DriveItemProps = {
  item: FileSystemItem;
  layout?: "grid" | "row";
  active?: boolean;
  onClick?: () => void;
  id?: string;
};

/**
 * Single reusable rendering unit for a Drive row/card. Handles both files and
 * folders in grid and list layouts so the old `FileCard`/`FolderCard` stay DRY.
 */
const DriveItem = ({
  item,
  layout = "grid",
  active,
  onClick,
  id,
}: DriveItemProps) => {
  const { open } = useFilePreview();
  const isFolder = item.type === "folder";
  const kindLabel = isFolder ? "folder" : kindFromMimeType(item.mimeType);
  const iconTone = isFolder
    ? "bg-primary/10 text-primary"
    : colorFor(kindLabel);
  const showMediaPreview = item.type === "file" && Boolean(item.url);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();

    if (item.type === "file") {
      open(item);
    } else {
      onClick?.();
    }
  };

  if (layout === "row") {
    return (
      <article
        onClick={onClick}
        id={id}
        aria-label={item.name}
        className={cn(
          "group grid w-full grid-cols-[minmax(0,1fr)_80px_40px] items-center gap-3 border-b border-border/40 px-4 py-2.5 text-left text-sm transition-colors last:border-0 md:grid-cols-[1fr_120px_160px_80px_40px]",
          active ? "bg-primary/5" : "hover:bg-accent/60",
          onClick && "cursor-pointer",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg",
              iconTone,
            )}
          >
            <FilePreview
              url={item.type === "file" ? item.url : undefined}
              previewType={item.type === "file" ? item.previewType : undefined}
            />
            {!showMediaPreview &&
              (item.type === "file" ? (
                fileIconFor(item.mimeType, "h-4 w-4")
              ) : (
                <Folder
                  className="h-4 w-4"
                  fill="currentColor"
                  fillOpacity={0.1}
                />
              ))}
          </div>
          <span className="truncate font-medium">{item.name}</span>
        </div>

        <div className="flex items-center">
          <OwnerAvatar />
        </div>

        <div className="hidden text-muted-foreground md:block">
          {item.updatedAt}
        </div>

        <div className="hidden text-muted-foreground md:block">
          {item.type === "file" ? formatBytes(item.size) : "—"}
        </div>

        <FileItemContextMenu
          selectedItemId={item.id}
          selectedItemName={item.name}
        />
      </article>
    );
  }

  return (
    <div
      role="button"
      tabIndex={active ? 0 : -1}
      aria-label={`${item.name}, ${kindLabel}`}
      aria-pressed={active}
      onClick={onClick}
      onDoubleClick={item.type === "file" ? () => open(item) : undefined}
      onKeyDown={handleKeyDown}
      id={id}
      className={cn(
        "group relative w-full overflow-hidden rounded-lg border bg-card p-2 text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
        "focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none",
        active
          ? "border-primary/60 ring-2 ring-primary/20"
          : "border-border/60 hover:border-primary/40",
        onClick && "cursor-pointer",
      )}
    >
      <div className="flex items-center justify-between px-1">
        <div className="min-w-0 truncate text-sm font-medium">{item.name}</div>

        <FileItemContextMenu
          selectedItemId={item.id}
          selectedItemName={item.name}
        />
      </div>

      <div className="relative mt-2 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-muted/60 to-muted/20">
        <FilePreview
          url={item.type === "file" ? item.url : undefined}
          previewType={item.type === "file" ? item.previewType : undefined}
        />

        {!showMediaPreview && (
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-105 sm:h-20 sm:w-20",
              iconTone,
            )}
          >
            {item.type === "file" ? (
              fileIconFor(item.mimeType, "h-8 w-8 sm:h-10 sm:w-10")
            ) : (
              <Folder
                className="h-8 w-8 sm:h-10 sm:w-10"
                fill="currentColor"
                fillOpacity={0.1}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriveItem;
export { DriveItem };