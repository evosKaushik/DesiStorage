import { Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FolderItem } from "@/store/useFileSystemStore";
import FileItemContextMenu from "../FileItemContextMenu";

export function FolderCard({
  folder,
  layout = "grid",
  active,
  onClick,
}: {
  folder: FolderItem;
  layout?: "grid" | "row";
  active?: boolean;
  onClick?: () => void;
}) {
  if (layout === "row") {
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
          "group flex justify-between md:grid w-full md:grid-cols-[1fr_140px_120px_40px] items-center gap-4 border-b border-border/40 px-4 py-2.5 text-left text-sm transition-colors last:border-0",
          active ? "bg-primary/5" : "hover:bg-accent/60",
          onClick && "cursor-pointer",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Folder className="h-4 w-4" fill="currentColor" fillOpacity={0.1} />
          </div>
          <span className="truncate font-medium">{folder.name}</span>
        </div>
        <div className="text-muted-foreground hidden md:block">
          {folder.updatedAt}
        </div>
        <div className="text-muted-foreground hidden md:block">—</div>

        <FileItemContextMenu
          selectedItemId={folder.id}
          selectedItemName={folder.name}
        />
      </div>
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
        "group relative flex w-full flex-col overflow-hidden rounded-lg border bg-card p-1 text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
        "focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none",
        active
          ? "border-primary/60 ring-2 ring-primary/20"
          : "border-border/60 hover:border-primary/40",
        onClick && "cursor-pointer",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="min-w-0 truncate text-sm font-medium">
          {folder.name}
        </div>

        <div className="shrink-0">
          <FileItemContextMenu
            selectedItemId={folder.id}
            selectedItemName={folder.name}
          />
        </div>
      </div>

      {/* Folder preview */}
      <div className="relative mt-2 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-md bg-muted/40">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Folder className="h-6 w-6" fill="currentColor" fillOpacity={0.1} />
        </div>
      </div>
    </div>
  );
}
