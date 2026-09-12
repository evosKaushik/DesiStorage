"use client";

import { useEffect, useState } from "react";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  type TrashedFileItem,
} from "@/store/useTrashStore";
import { colorFor, kindFromMimeType } from "./file-meta";
import {
  Image as ImageIcon,
  FileSpreadsheet,
  Film,
  Music,
  Archive,
  FileText,
} from "lucide-react";

const iconElementFor = (mimeType: string) => {
  const kind = kindFromMimeType(mimeType);

  switch (kind) {
    case "image":
      return <ImageIcon className="h-4 w-4" />;
    case "sheet":
      return <FileSpreadsheet className="h-4 w-4" />;
    case "video":
      return <Film className="h-4 w-4" />;
    case "audio":
      return <Music className="h-4 w-4" />;
    case "zip":
      return <Archive className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

type ConfirmAction = { kind: "empty" } | { kind: "delete"; item: TrashedFileItem };

export const TrashView = ({ view }: { view: "grid" | "list" }) => {
  const items = useTrashStore(selectTrashedItems);
  const loading = useTrashStore((state) => state.loading);
  const fetchTrashed = useTrashStore((state) => state.fetchTrashed);
  const restoreItem = useTrashStore((state) => state.restoreItem);
  const deletePermanently = useTrashStore((state) => state.deletePermanently);
  const emptyTrash = useTrashStore((state) => state.emptyTrash);

  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void fetchTrashed();
  }, [fetchTrashed]);

  const onRestore = async (item: TrashedFileItem) => {
    setBusyId(item.id);
    await restoreItem(item.id);
    setBusyId(null);
  };

  const onDeleteForever = async () => {
    if (!confirm || confirm.kind !== "delete") return;

    const item = confirm.item;
    setBusyId(item.id);
    await deletePermanently(item.id);
    setBusyId(null);
    setConfirm(null);
  };

  const onEmptyTrash = async () => {
    await emptyTrash();
    setConfirm(null);
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

  const renderCard = (item: TrashedFileItem, index: number) => {
    const kind = kindFromMimeType(item.mimeType);
    const busy = busyId === item.id;

    if (view === "list") {
      return (
        <article
          key={item.id}
          className={cn(
            "group flex w-full items-center gap-4 border-b border-border/40 px-4 py-2.5 text-left text-sm transition-colors last:border-0",
            index % 2 === 1 && "bg-muted/20",
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              colorFor(kind),
            )}
          >
            {iconElementFor(item.mimeType)}
          </div>
          <div className="min-w-0 flex-1 truncate font-medium">{item.name}</div>
          <div className="w-20 shrink-0 text-right tabular-nums text-muted-foreground">
            {formatBytes(item.size)}
          </div>
          <div className="hidden w-28 shrink-0 text-right text-muted-foreground sm:block">
            {item.deletedAt}
          </div>
          <div className="flex shrink-0 items-center gap-1">
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
              disabled={busy}
              onClick={() => setConfirm({ kind: "delete", item })}
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
        className="group relative w-full overflow-hidden rounded-lg border border-border/60 bg-card p-2 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
      >
        <div className="truncate px-1 text-sm font-medium">{item.name}</div>

        <div className="relative mt-2 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-muted/60 to-muted/20">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm sm:h-20 sm:w-20",
              colorFor(kind),
            )}
          >
            {iconElementFor(item.mimeType)}
          </div>

          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center gap-2 bg-background/80 backdrop-blur-[2px] transition-opacity",
              "opacity-0 focus-within:opacity-100 group-hover:opacity-100",
            )}
          >
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={busy}
              onClick={() => onRestore(item)}
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
              disabled={busy}
              onClick={() => setConfirm({ kind: "delete", item })}
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
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {items.length} item{items.length === 1 ? "" : "s"} · auto-deleted
          after 30 days
        </span>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-destructive"
          onClick={() => setConfirm({ kind: "empty" })}
        >
          <Trash2 className="h-4 w-4" /> Empty trash
        </Button>
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

      <Dialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {confirm?.kind === "empty" ? "Empty trash?" : "Delete forever?"}
            </DialogTitle>
            <DialogDescription>
              {confirm?.kind === "empty"
                ? `${items.length} item${items.length === 1 ? "" : "s"} will be permanently deleted. This can't be undone.`
                : `“${confirm?.kind === "delete" ? confirm.item.name : ""}” will be permanently deleted. This can't be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirm?.kind === "empty" ? onEmptyTrash : onDeleteForever}
            >
              {confirm?.kind === "empty" ? "Empty trash" : "Delete forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrashView;