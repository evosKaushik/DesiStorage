import { Copy, Globe, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SHARE_LINKS } from "@/features/dashboard/data/dashboard";
import { FILE_ICONS, colorFor } from "./file-meta";

export function SharedLinks({ query }: { query: string }) {
  const filtered = SHARE_LINKS.filter((l) =>
    l.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-card">
      {filtered.map((l, i) => {
        const Icon = FILE_ICONS[l.kind];
        const AccessIcon =
          l.access === "Anyone with link"
            ? Globe
            : l.access === "Team only"
              ? Users
              : Lock;
        return (
          <div
            key={l.id}
            className={cn(
              "flex items-center gap-4 px-4 py-3",
              i < filtered.length - 1 && "border-b border-border/50",
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                colorFor(l.kind),
              )}
            >
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{l.name}</div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono text-primary/90">{l.url}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <AccessIcon className="h-3 w-3" /> {l.access}
                </span>
                <span>·</span>
                <span>{l.views} views</span>
                <span>·</span>
                <span>Expires {l.expires}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(`https://${l.url}`)
                  .catch(() => {});
              }}
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              Revoke
            </Button>
          </div>
        );
      })}
      {filtered.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No shared links.
        </div>
      )}
    </div>
  );
}
