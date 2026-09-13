"use client";

import { ArrowUp, ChevronRight } from "lucide-react";
import useFileSystemStore, {
  selectFolderTrail,
  selectLoadingFolder,
} from "@/store/useFileSystemStore";
import { cn } from "@/lib/utils";

/**
 * Breadcrumb for My Drive navigation. Mirrors the current folder path
 * (root → … → open folder); ancestors are clickable to jump back, and the
 * up-arrow climbs one level at a time. Mirrors the store's `folderTrail`.
 */
const DriveBreadcrumb = () => {
  const trail = useFileSystemStore(selectFolderTrail);
  const loading = useFileSystemStore(selectLoadingFolder);
  const goUp = useFileSystemStore((state) => state.goUp);
  const goToCrumb = useFileSystemStore((state) => state.goToCrumb);

  const atRoot = trail.length <= 1;

  return (
    <div className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
      <ol className="flex min-w-0 items-center gap-1" aria-label="Breadcrumb">
        {(trail.length === 0
          ? [{ id: "root", name: "My Drive" }]
          : trail
        ).map((crumb, i) => {
          const isLast = i === trail.length - 1 && trail.length > 0;

          return (
            <li key={crumb.id} className="flex min-w-0 items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              {isLast ? (
                <span
                  aria-current="page"
                  className="truncate font-medium text-foreground"
                >
                  {crumb.name}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void goToCrumb(i)}
                  className="truncate rounded-md transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none disabled:opacity-60"
                >
                  {crumb.name}
                </button>
              )}
            </li>
          );
        })}
      </ol>

      {!atRoot && (
        <button
          type="button"
          aria-label="Up to parent folder"
          title="Up to parent folder"
          disabled={loading}
          onClick={() => void goUp()}
          className={cn(
            "ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
            "hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none disabled:opacity-60",
          )}
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default DriveBreadcrumb;