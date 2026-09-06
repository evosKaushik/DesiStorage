"use client"
import { FileCard } from "./FileCard";
import { FileTable } from "./FileTable";
import { useShallow } from "zustand/react/shallow";
import useFileSystemStore, { selectFiles } from "@/store/useFileSystemStore";

export function RecentTimeline({
  selected,
  onSelect,
  view,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
  view: "grid" | "list";
}) {
  const files = useFileSystemStore(useShallow(selectFiles));

  const groups = [
    { label: "Today", items: files.slice(0, 3) },
    { label: "Yesterday", items: files.slice(3, 5) },
    { label: "Earlier this week", items: files.slice(5) },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="mt-6 space-y-8">
      {groups.map((g) => (
        <div key={g.label}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {g.label}
          </h3>
          {g.items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-sm text-muted-foreground">
              Nothing in this period.
            </div>
          )}
          {view === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {g.items.map((f) => (
                <FileCard
                  key={f.id}
                  file={f}
                  active={selected === f.id}
                  onClick={() => onSelect(f.id)}
                />
              ))}
            </div>
          ) : (
            <FileTable
              files={g.items}
              selected={selected}
              onSelect={onSelect}
            />
          )}
        </div>
      ))}
    </div>
  );
}