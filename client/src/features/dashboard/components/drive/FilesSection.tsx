import { FileRow } from "@/features/dashboard/types/types";
import { FileCard } from "./FileCard";
import { FileTable } from "./FileTable";

export function FilesSection({
  files,
  view,
  selected,
  onSelect,
  emptyLabel = "No files to show here.",
}: {
  files: FileRow[];
  view: "grid" | "list";
  selected: string | null;
  onSelect: (id: string) => void;
  emptyLabel?: string;
}) {
  if (files.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }
  if (view === "grid") {
    return (
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {files.map((f) => (
          <FileCard
            key={f.id}
            file={f}
            active={selected === f.id}
            onClick={() => onSelect(f.id)}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="mt-6">
      <FileTable files={files} selected={selected} onSelect={onSelect} />
    </div>
  );
}
