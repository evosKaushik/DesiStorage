"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpAZIcon } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import useFileSystemStore, {
  selectFiles,
  selectFolders,
  type FileSystemItem,
} from "@/store/useFileSystemStore";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import DialogWithInput from "@/components/DialogWithInput";
import useTrashStore from "@/store/useTrashStore";
import { FileItemContentBody } from "../FileItemContextMenu";
import { DriveItem } from "./DriveItem";

const ROW_HEADER_CLASSES =
  "grid grid-cols-[minmax(0,1fr)_80px_40px] items-center gap-3 border-b border-border/60 bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid-cols-[1fr_120px_160px_80px_40px]";

// Matches the grid template: minmax(200px, 1fr) + gap-4 (16px).
const CARD_MIN_WIDTH = 200;
const GRID_GAP = 16;

const FileSystemSection = ({
  view,
  selected,
  onSelect,
  emptyLabel = "No files to show here.",
}: {
  view: "grid" | "list";
  selected: string | null;
  onSelect: (id: string) => void;
  emptyLabel?: string;
}) => {
  const folders = useFileSystemStore(useShallow(selectFolders));
  const files = useFileSystemStore(useShallow(selectFiles));

  const renameItemById = useFileSystemStore((state) => state.renameItemById);
  const removeItem = useFileSystemStore((state) => state.removeItem);
  const moveToTrash = useTrashStore((state) => state.moveToTrash);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const items = useMemo(
    () => [...folders, ...files] as FileSystemItem[],
    [folders, files],
  );

  const gridRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    if (view !== "grid") return;

    const el = gridRef.current;
    if (!el) return;

    const measure = () => {
      const cols = Math.max(
        1,
        Math.floor((el.clientWidth + GRID_GAP) / (CARD_MIN_WIDTH + GRID_GAP)),
      );
      setColumns(cols);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);

    return () => observer.disconnect();
  }, [view]);

  // Refocus the newly selected item so keyboard navigation stays smooth.
  const focusSelected = useCallback(() => {
    if (!selected) return;
    const el = document.getElementById(`fs-item-${selected}`);
    if (el) el.focus();
  }, [selected]);

  useEffect(() => {
    focusSelected();
  }, [focusSelected]);

  const moveSelection = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      if (items.length === 0) return;

      let index = items.findIndex((item) => item.id === selected);
      if (index === -1) index = 0;

      switch (direction) {
        case "right":
          index = Math.min(index + 1, items.length - 1);
          break;
        case "left":
          index = Math.max(index - 1, 0);
          break;
        case "down":
          index = Math.min(
            index + (view === "grid" ? columns : 1),
            items.length - 1,
          );
          break;
        case "up":
          index = Math.max(index - (view === "grid" ? columns : 1), 0);
          break;
      }

      onSelect(items[index].id);
      requestAnimationFrame(focusSelected);
    },
    [columns, focusSelected, items, onSelect, selected, view],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveSelection("right");
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveSelection("left");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      moveSelection("down");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveSelection("up");
    } else if (e.key === "Delete" && selected) {
      e.preventDefault();
      const item = items.find((it) => it.id === selected);

      if (item?.type === "file") {
        void moveToTrash(item.id);
      } else if (item) {
        // Folders have no trash support yet — just hide locally.
        removeItem(selected);
      }
    }
  };

  const renderItem = (item: FileSystemItem) => (
    <ContextMenu key={item.id}>
      <ContextMenuTrigger>
        <DriveItem
          id={`fs-item-${item.id}`}
          item={item}
          active={selected === item.id}
          layout={view === "grid" ? "grid" : "row"}
          onClick={() => {
            onSelect(item.id);
            focusSelected();
          }}
        />
      </ContextMenuTrigger>
      <ContextMenuContent>
        <FileItemContentBody
          onRename={() => setRenameTarget({ id: item.id, name: item.name })}
          onTrash={
            item.type === "file" ? () => void moveToTrash(item.id) : undefined
          }
        />
      </ContextMenuContent>
    </ContextMenu>
  );

  if (folders.length === 0 && files.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  if (view === "grid") {
    return (
      <div onKeyDown={handleKeyDown}>
        <div
          ref={gridRef}
          className="mt-6 grid grid-cols-1 gap-4 xs:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]"
        >
          {items.map(renderItem)}
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
      </div>
    );
  }

  return (
    <div
      className="mt-6 overflow-hidden rounded-xl border border-border/60"
      onKeyDown={handleKeyDown}
    >
      <div className={ROW_HEADER_CLASSES}>
        <div className="flex items-center gap-2">
          <span>Name</span>
          <ArrowUpAZIcon />
        </div>
        <div>Owner</div>
        <div className="hidden md:block">Modified</div>
        <div className="hidden md:block">Size</div>
        <div>More</div>
      </div>
      {items.map(renderItem)}
    </div>
  );
};

export { FileSystemSection };