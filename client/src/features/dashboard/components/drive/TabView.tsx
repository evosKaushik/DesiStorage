import { FolderPlus, RotateCcw, Trash2, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FILES,
  QUICK_FOLDERS,
  SHARED_FILES,
  TRASH_FILES,
} from "@/features/dashboard/data/dashboard";
import { FileRow } from "@/features/dashboard/types/types";
import type { DashboardTab } from "@/features/dashboard/components/DashboardShell";
import { TabShell } from "./TabShell";
import { FilesSection } from "./FilesSection";
import { HomeTab } from "./HomeTab";
import { RecentTimeline } from "./RecentTimeline";
import { SharedLinks } from "./SharedLinks";

export function TabView({
  tab,
  query,
  view,
  setView,
  selected,
  setSelected,
  openPicker,
}: {
  tab: DashboardTab;
  query: string;
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  selected: string | null;
  setSelected: (id: string | null) => void;
  openPicker: () => void;
}) {
  const filter = (arr: FileRow[]) =>
    arr.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

  if (tab === "home") return <HomeTab setSelected={setSelected} />;

  if (tab === "shared") {
    return (
      <TabShell
        crumbs={["Home", "Shared with me"]}
        title="Shared with me"
        subtitle="Files and folders other people have shared with you."
        view={view}
        setView={setView}
        openPicker={openPicker}
      >
        
        <FilesSection
          files={filter(SHARED_FILES)}
          view={view}
          selected={selected}
          onSelect={setSelected}
        />
      </TabShell>
    );
  }

  if (tab === "recent") {
    const recent = filter([...FILES].slice(0, 6));
    return (
      <TabShell
        crumbs={["Home", "Recent"]}
        title="Recent"
        subtitle="Files you've viewed or edited recently."
        view={view}
        setView={setView}
        openPicker={openPicker}
      >
        <RecentTimeline
          files={recent}
          selected={selected}
          onSelect={setSelected}
          view={view}
        />
      </TabShell>
    );
  }

  if (tab === "starred") {
    return (
      <TabShell
        crumbs={["Home", "Starred"]}
        title="Starred"
        subtitle="Everything you've marked with a star."
        view={view}
        setView={setView}
        openPicker={openPicker}
      >
        <FilesSection
          files={filter(FILES.filter((f) => f.starred))}
          view={view}
          selected={selected}
          onSelect={setSelected}
          emptyLabel="Star files to keep them one click away."
        />
      </TabShell>
    );
  }

  if (tab === "links") {
    return (
      <TabShell
        crumbs={["Home", "Shared links"]}
        title="Shared links"
        subtitle="Public and private links you've created."
        view={view}
        setView={setView}
        hideViewSwitch
        openPicker={openPicker}
      >
        <SharedLinks query={query} />
      </TabShell>
    );
  }

  if (tab === "trash") {
    return (
      <TabShell
        crumbs={["Home", "Trash"]}
        title="Trash"
        subtitle="Items in Trash are deleted forever after 30 days."
        view={view}
        setView={setView}
        openPicker={openPicker}
        actions={
          <>
            <Button variant="outline" size="sm">
              <RotateCcw className="mr-2 h-4 w-4" /> Restore all
            </Button>
            <Button size="sm" variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Empty trash
            </Button>
          </>
        }
      >
        <FilesSection
          files={filter(TRASH_FILES)}
          view={view}
          selected={selected}
          onSelect={setSelected}
          emptyLabel="Nothing in the trash."
        />
      </TabShell>
    );
  }

  // my-drive default
  return (
    <TabShell
      crumbs={["Home", "My Drive"]}
      title="My Drive"
      subtitle="All your files, folders and shared workspaces in one place."
      view={view}
      setView={setView}
      openPicker={openPicker}
      actions={
        <Button variant="outline" size="sm" className="gap-2">
          <FolderPlus className="h-4 w-4" /> New folder
        </Button>
      }
    >
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Quick access
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_FOLDERS.map((f) => (
            <button
              key={f.id}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div
                className={cn(
                  "absolute inset-0 -z-10 bg-gradient-to-br opacity-60",
                  f.color,
                )}
              />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/80 shadow-sm">
                  <Folder
                    className="h-5 w-5 text-primary"
                    fill="currentColor"
                    fillOpacity={0.1}
                  />
                </div>
                {f.shared && (
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    Shared
                  </Badge>
                )}
              </div>
              <div className="mt-4 truncate text-sm font-semibold">
                {f.name}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {f.size} · {f.modified}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Files
          </h2>
          <span className="text-xs text-muted-foreground">
            {filter(FILES).length} items
          </span>
        </div>
        <FilesSection
          files={filter(FILES)}
          view={view}
          selected={selected}
          onSelect={setSelected}
        />
      </section>
    </TabShell>
  );
}
