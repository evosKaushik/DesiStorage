import { Star, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileRow } from "@/features/dashboard/types/types";
import { FILE_ICONS, colorFor } from "./file-meta";

export function FileCard({
  file,
  active,
  onClick,
}: {
  file: FileRow;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = FILE_ICONS[file.kind];
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-left transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
        active
          ? "border-primary/60 ring-2 ring-primary/20"
          : "border-border/60 hover:border-primary/40",
      )}
    >
      <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-muted/60 to-muted/20">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            colorFor(file.kind),
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        {file.starred && (
          <Star className="absolute right-2 top-2 h-4 w-4 fill-amber-400 text-amber-400" />
        )}
      </div>
      <div className="border-t border-border/60 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{file.name}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {file.size} · {file.modified}
            </div>
          </div>
          <MoreVertical className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </button>
  );
}
