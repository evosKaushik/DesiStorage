import { Star, MoreVertical, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileRow } from "@/features/dashboard/types/types";
import { FILE_ICONS, colorFor } from "./file-meta";

export function FileTable({
  files,
  selected,
  onSelect,
}: {
  files: FileRow[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <div className="grid grid-cols-[1fr_120px_140px_120px_40px] gap-4 border-b border-border/60 bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <div>Name</div>
        <div>Owner</div>
        <div>Modified</div>
        <div>Size</div>
        <div />
      </div>
      {files.map((f) => {
        const Icon = FILE_ICONS[f.kind];
        const active = selected === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            className={cn(
              "grid w-full grid-cols-[1fr_120px_140px_120px_40px] items-center gap-4 border-b border-border/40 px-4 py-2.5 text-left text-sm transition-colors last:border-0",
              active ? "bg-primary/5" : "hover:bg-accent/60",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  colorFor(f.kind),
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="truncate font-medium">{f.name}</span>
              {f.starred && (
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              )}
              {f.shared && (
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
            <div className="text-muted-foreground">{f.owner}</div>
            <div className="text-muted-foreground">{f.modified}</div>
            <div className="text-muted-foreground">{f.size}</div>
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        );
      })}
    </div>
  );
}
