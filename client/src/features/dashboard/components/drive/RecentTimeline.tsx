import { FileRow } from "@/features/dashboard/types/types";
import { FilesSection } from "./FilesSection";

export function RecentTimeline({
  files,
  selected,
  onSelect,
  view,
}: {
  files: FileRow[];
  selected: string | null;
  onSelect: (id: string) => void;
  view: "grid" | "list";
}) {
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
          <FilesSection
            files={g.items}
            view={view}
            selected={selected}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  );
}
