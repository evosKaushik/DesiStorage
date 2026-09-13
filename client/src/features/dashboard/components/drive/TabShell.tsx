import { Home, ChevronRight, Grid3x3, List, Upload } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TabShellProps = {
  crumbs: string[];
  /** Replaces the static `crumbs` trail (e.g. the live My Drive breadcrumb). */
  breadcrumb?: ReactNode;
  title: string;
  subtitle: string;
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  actions?: ReactNode;
  hideViewSwitch?: boolean;
  /** Hides the header "Upload" button (e.g. Trash, where uploading makes no sense). */
  hideUpload?: boolean;
  openPicker: () => void;
  children: ReactNode;
};

const TabShell = ({
  crumbs,
  breadcrumb,
  title,
  subtitle,
  view,
  setView,
  actions,
  hideViewSwitch,
  hideUpload = false,
  openPicker,
  children,
}: TabShellProps) => {
  return (
    <>
      {breadcrumb ?? (
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
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex max-lg:w-full items-center justify-between gap-2">
          {(!hideUpload || actions) && (
            <div className="flex items-center gap-2">
              {!hideUpload && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={openPicker}
                >
                  <Upload className="h-4 w-4" /> Upload
                </Button>
              )}
              {actions}
            </div>
          )}
          {/* Layout Switch */}
          {!hideViewSwitch && (
            <div className="ml-1 hidden overflow-hidden rounded-lg border border-border/60 xs:flex">
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
};

export default TabShell;
export { TabShell };