import { Plus, X, Eye, Download, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { FileRow } from "@/features/dashboard/types/types";
import { FILE_ICONS, colorFor } from "./file-meta";

export function PreviewPane({
  file,
  onClose,
}: {
  file: FileRow;
  onClose: () => void;
}) {
  const Icon = FILE_ICONS[file.kind];
  return (
    <aside className="sticky top-0 hidden h-[calc(100vh-4rem)] w-[340px] shrink-0 flex-col overflow-y-auto border-l border-border/60 bg-card/40 self-start xl:flex">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="text-sm font-semibold">Details</div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4">
        <div className="flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-muted/60 to-muted/20">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl",
              colorFor(file.kind),
            )}
          >
            <Icon className="h-8 w-8" />
          </div>
        </div>

        <div className="mt-4">
          <div className="truncate text-base font-semibold">{file.name}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {file.size} · Modified {file.modified}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" className="flex-1 gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Open
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Link2 className="h-3.5 w-3.5" /> Share
          </Button>
        </div>

        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            People with access
          </div>
          <div className="mt-3 flex items-center -space-x-2">
            {["AR", "PS", "RK", "AN"].map((i, idx) => (
              <Avatar key={i} className="h-8 w-8 border-2 border-card">
                <AvatarFallback
                  className={cn(
                    "text-xs font-semibold",
                    idx % 2
                      ? "bg-violet-500/15 text-violet-600"
                      : "bg-primary/15 text-primary",
                  )}
                >
                  {i}
                </AvatarFallback>
              </Avatar>
            ))}
            <button className="ml-3 flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-border/80 text-muted-foreground hover:border-primary/60 hover:text-primary">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            File info
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="Type" v={file.kind.toUpperCase()} />
            <Row k="Owner" v={file.owner} />
            <Row k="Location" v="My Drive" />
            <Row k="Modified" v={file.modified} />
            <Row k="Created" v="Jul 12, 2026" />
            <Row k="Opened" v="Just now" />
          </dl>
        </div>

        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Activity
          </div>
          <ul className="mt-3 space-y-3 text-sm">
            <ActivityItem who="You" what="edited this file" when="12 min ago" />
            <ActivityItem who="Priya S." what="left a comment" when="2h ago" />
            <ActivityItem
              who="Ananya P."
              what="shared with team"
              when="Yesterday"
            />
          </ul>
        </div>
      </div>
    </aside>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="truncate text-right font-medium">{v}</dd>
    </div>
  );
}

function ActivityItem({
  who,
  what,
  when,
}: {
  who: string;
  what: string;
  when: string;
}) {
  return (
    <li className="flex gap-3">
      <Avatar className="h-7 w-7">
        <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
          {who.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="text-xs">
          <span className="font-semibold">{who}</span>{" "}
          <span className="text-muted-foreground">{what}</span>
        </div>
        <div className="text-[11px] text-muted-foreground">{when}</div>
      </div>
    </li>
  );
}
