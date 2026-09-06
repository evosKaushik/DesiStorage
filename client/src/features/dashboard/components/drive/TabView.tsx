import { FolderPlus, RotateCcw, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DashboardTab } from "@/features/dashboard/types/dashboard-tabs";
import { useShallow } from "zustand/react/shallow";
import useFileSystemStore, { selectFiles } from "@/store/useFileSystemStore";
import { TabShell } from "./TabShell";
import { FileSystemSection } from "./FilesSection";

const HomeTab = dynamic(() => import("./HomeTab").then((m) => m.HomeTab));
const RecentTimeline = dynamic(() =>
  import("./RecentTimeline").then((m) => m.RecentTimeline),
);
const SharedLinks = dynamic(() =>
  import("./SharedLinks").then((m) => m.SharedLinks),
);

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
  const files = useFileSystemStore(useShallow(selectFiles));

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
        <FileSystemSection
          view={view}
          selected={selected}
          onSelect={setSelected}
        />
      </TabShell>
    );
  }

  if (tab === "recent") {
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
        <FileSystemSection
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
        <FileSystemSection
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
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          {/* <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Files
          </h2> */}
          <span className="text-xs text-muted-foreground">
            {files.length} items
          </span>
        </div>
        <FileSystemSection
          view={view}
          selected={selected}
          onSelect={setSelected}
        />
      </section>
    </TabShell>
  );
}
