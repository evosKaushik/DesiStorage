"use client";

import { useEffect, useState } from "react";
import {
  Archive,
  FileSpreadsheet,
  FileText,
  Film,
  Folder,
  Image as ImageIcon,
  Loader2,
  Music,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/format";
import useTrashStore, {
  selectTrashedItems,
  type TrashedItem,
} from "@/store/useTrashStore";
import { colorFor, kindFromMimeType } from "./file-meta";

const iconElementFor = (
  kind: TrashedItem["kind"],
  mimeType?: string,
  sizeClass = "h-4 w-4",
) => {
  if (kind === "folder") return <Folder className={sizeClass} />;

  const fileKind = kindFromMimeType(mimeType ?? "");

  switch (fileKind) {
    case "image":
      return <ImageIcon className={sizeClass} />;
    case "sheet":
      return <FileSpreadsheet className={sizeClass} />;
    case "video":
      return <Film className={sizeClass} />;
    case "audio":
      return <Music className={sizeClass} />;
    case "zip":
      return <Archive className={sizeClass} />;
    default:
      return <FileText className={sizeClass} />;
  }
};

export const TrashView = ({ view }: { view: "grid" | "list" }) => {
  const items = useTrashStore(selectTrashedItems);
  const loading = useTrashStore((state) => state.loading);
  const fetchTrashed = useTrashStore((state) => state.fetchTrashed);
  const restoreItem = useTrashStore((state) => state.restoreItem);
  const restoreMany = useTrashStore((state) => state.restoreMany);
  const deleteManyPermanently = useTrashStore(
    (state) => state.deleteManyPermanently,
  );

  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  useEffect(() => {
    void fetchTrashed();
  }, [fetchTrashed]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const allSelected = selected.size === items.length;
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(items.map((item) => item.id)));
  };

  const onRestore = async (item: TrashedItem) => {
    setBusyId(item.id);
    await restoreItem(item.id, item.kind);
    setBusyId(null);
  };

  const restoreSelected = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;

    setSelected(new Set());
    await restoreMany(ids);
  };

  const deletePermanently = (toDelete: TrashedItem[]) => {
    if (toDelete.length === 0) return;

    const ids = toDelete.map((item) => item.id);
    setSelected(new Set());
    void deleteManyPermanently(ids);
  };

  if (loading) {
    return (
      <div className="mt-6 flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading trash…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-sm text-muted-foreground">
        Nothing in the trash.
      </div>
    );
  }

  const renderCard = (item: TrashedItem) => {
    const tone =
      item.kind === "folder"
        ? "bg-primary/10 text-primary"
        : colorFor(kindFromMimeType(item.mimeType ?? ""));
    const busy = busyId === item.id;
    const checked = selected.has(item.id);

    if (view === "list") {
      return (
        <article
          key={item.id}
          className={cn(
            "group flex w-full cursor-pointer items-center gap-4 border-b border-border/40 px-4 py-2.5 text-left text-sm transition-colors last:border-0",
            checked && "bg-primary/5",
          )}
          onClick={() => toggle(item.id)}
        >
          <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={checked}
            onCheckedChange={() => toggle(item.id)}
            aria-label={`Select ${item.name}`}
            className="shrink-0"
          />
          </div>
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              tone,
            )}
          >
            {iconElementFor(item.kind, item.mimeType, "h-5 w-5")}
          </div>
          <div className="min-w-0 flex-1 truncate font-medium">{item.name}</div>
          <div className="w-20 shrink-0 text-right tabular-nums text-muted-foreground">
            {formatBytes(item.size)}
          </div>
          <div className="hidden w-28 shrink-0 text-right text-muted-foreground sm:block">
            {item.deletedAt}
          </div>
          <div
            className="flex shrink-0 items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={busy}
              onClick={() => onRestore(item)}
              aria-label={`Restore ${item.name}`}
              title="Restore"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 text-emerald-500" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => deletePermanently([item])}
              aria-label={`Delete ${item.name} forever`}
              title="Delete forever"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </article>
      );
    }

    return (
      <div
        key={item.id}
        className={cn(
          "group relative w-full cursor-pointer overflow-hidden rounded-lg border border-border/60 bg-card p-2 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg",
          checked && "border-primary/50 ring-2 ring-primary/20",
        )}
        onClick={() => toggle(item.id)}
      >
        <div className="flex items-center justify-between gap-1 px-1">
          <div className="min-w-0 truncate text-sm font-medium">{item.name}</div>
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={checked}
              onCheckedChange={() => toggle(item.id)}
              aria-label={`Select ${item.name}`}
              className="shrink-0"
            />
          </div>
        </div>

        <div className="relative mt-2 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-muted/60 to-muted/20">
          <div
            className={cn(
              "flex h-20 w-20 items-center justify-center rounded-2xl shadow-sm sm:h-24 sm:w-24",
              tone,
            )}
          >
            {iconElementFor(item.kind, item.mimeType, "h-8 w-8 sm:h-10 sm:w-10")}
          </div>

          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center gap-2 bg-background/80 backdrop-blur-[2px] transition-opacity",
              "opacity-0 focus-within:opacity-100 group-hover:opacity-100",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={busy}
              onClick={async () => onRestore(item)}
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              Restore
            </Button>
            <Button
              size="sm"
              variant="default"
              className="gap-1.5"
              onClick={() => deletePermanently([item])}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 pt-2 text-[11px] text-muted-foreground">
          <span className="tabular-nums">{formatBytes(item.size)}</span>
          <span>{item.deletedAt}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {selected.size === 0 ? (
          <>
            <span className="text-xs text-muted-foreground">
              {items.length} item{items.length === 1 ? "" : "s"} · auto-deleted
              after 30 days
            </span>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all trash items"
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive"
                onClick={() => setConfirmEmpty(true)}
              >
                <Trash2 className="h-4 w-4" /> Empty trash
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              {selected.size} of {items.length} selected
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={restoreSelected}
              >
                <RotateCcw className="h-4 w-4 text-emerald-500" /> Restore
                selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() =>
                  deletePermanently(
                    items.filter((item) => selected.has(item.id)),
                  )
                }
              >
                <Trash2 className="h-4 w-4" /> Delete selected
              </Button>
            </div>
          </>
        )}
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map(renderCard)}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          {items.map(renderCard)}
        </div>
      )}

      <Dialog open={confirmEmpty} onOpenChange={setConfirmEmpty}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Empty trash?</DialogTitle>
            <DialogDescription>
              {items.length} item{items.length === 1 ? "" : "s"} will be
              permanently deleted. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmEmpty(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmEmpty(false);
                deletePermanently(items);
              }}
            >
              Empty trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrashView;