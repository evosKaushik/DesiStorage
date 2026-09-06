"use client";

import { FileCard } from "./FileCard";
import { FolderCard } from "./FolderCard";
import { useShallow } from "zustand/react/shallow";
import useFileSystemStore, {
  selectFiles,
  selectFolders,
} from "@/store/useFileSystemStore";
import { ArrowUpAZIcon } from "lucide-react";
import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import DialogWithInput from "@/components/DialogWithInput";
import { FileItemContentBody } from "../FileItemContextMenu";

const ROW_HEADER_CLASSES =
  "flex justify-between md:grid md:grid-cols-[1fr_160px_140px_120px_40px] gap-4 border-b border-border/60 bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground";

export function FileSystemSection({
  view,
  selected,
  onSelect,
  emptyLabel = "No files to show here.",
}: {
  view: "grid" | "list";
  selected: string | null;
  onSelect: (id: string) => void;
  emptyLabel?: string;
}) {
  const folders = useFileSystemStore(useShallow(selectFolders));
  const files = useFileSystemStore(useShallow(selectFiles));

  const renameItemById = useFileSystemStore((state) => state.renameItemById);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  if (folders.length === 0 && files.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  if (view === "grid") {
    return (
      <>
        <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        {folders.map((f) => (
          <ContextMenu key={f.id}>
            <ContextMenuTrigger>
              <FolderCard
                folder={f}
                active={selected === f.id}
                onClick={() => onSelect(f.id)}
              />
            </ContextMenuTrigger>
            <ContextMenuContent>
              <FileItemContentBody
                onRename={() => setRenameTarget({ id: f.id, name: f.name })}
              />
            </ContextMenuContent>
          </ContextMenu>
        ))}
        {files.map((f) => (
          <ContextMenu key={f.id}>
            <ContextMenuTrigger>
              <FileCard
                file={f}
                active={selected === f.id}
                onClick={() => onSelect(f.id)}
              />
            </ContextMenuTrigger>
            <ContextMenuContent>
              <FileItemContentBody
                onRename={() => setRenameTarget({ id: f.id, name: f.name })}
              />
            </ContextMenuContent>
          </ContextMenu>
        ))}
        </div>

        <DialogWithInput
          title="Rename"
          defaultValue={renameTarget?.name}
          placeholder="Enter new name"
          open={renameTarget !== null}
          onOpenChange={(open) => {
            if (!open) setRenameTarget(null);
          }}
          onSubmit={(newName) => {
            if (renameTarget) {
              renameItemById(renameTarget.id, newName);
              // Todo: Implement Rename API
            }
          }}
        />
      </>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-border/60">
      <div className={ROW_HEADER_CLASSES}>
        <div className="flex items-center gap-2">
          <span>Name</span>
          <ArrowUpAZIcon />
        </div>
        <div className="hidden md:block">Owner</div>
        <div className="hidden md:block">Modified</div>
        <div className="hidden md:block">Size</div>
        <div>More</div>
      </div>
      {folders.map((f) => (
        <FolderCard
          key={f.id}
          folder={f}
          layout="row"
          active={selected === f.id}
          onClick={() => onSelect(f.id)}
        />
      ))}
      {files.map((f) => (
        <FileCard
          key={f.id}
          file={f}
          layout="row"
          active={selected === f.id}
          onClick={() => onSelect(f.id)}
        />
      ))}
    </div>
  );
}
