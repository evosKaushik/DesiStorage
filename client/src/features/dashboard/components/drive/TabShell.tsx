import { Home, ChevronRight, Grid3x3, List, Upload } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TabShell({
  crumbs,
  title,
  subtitle,
  view,
  setView,
  actions,
  hideViewSwitch,
  openPicker,
  children,
}: {
  crumbs: string[];
  title: string;
  subtitle: string;
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  actions?: ReactNode;
  hideViewSwitch?: boolean;
  openPicker: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Home className="h-3.5 w-3.5" />
        {crumbs.map((c, i) => (
          <span key={c} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
            <span
              className={cn(
                i === crumbs.length - 1 && "font-medium text-foreground",
              )}
            >
              {c}
            </span>
          </span>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={openPicker}
          >
            <Upload className="h-4 w-4" /> Upload
          </Button>
          {actions}
          {!hideViewSwitch && (
            <div className="ml-1 flex overflow-hidden rounded-lg border border-border/60">
              <button
                onClick={() => setView("grid")}
                className={cn(
                  "flex h-9 w-9 items-center justify-center",
                  view === "grid"
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Grid view"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "flex h-9 w-9 items-center justify-center border-l border-border/60",
                  view === "list"
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>



      {children}
    </>
  );
}
