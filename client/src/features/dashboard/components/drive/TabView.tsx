import { FolderPlus } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import DialogWithInput from "@/components/DialogWithInput";
import type { DashboardTab } from "@/features/dashboard/types/dashboard-tabs";
import { useShallow } from "zustand/react/shallow";
import useFileSystemStore, { selectItems } from "@/store/useFileSystemStore";
import { TabShell } from "./TabShell";
import { FileSystemSection } from "./FilesSection";
import { TrashView } from "./TrashView";
import DriveBreadcrumb from "./DriveBreadcrumb";

const HomeTab = dynamic(() => import("./HomeTab").then((m) => m.HomeTab));
const RecentTimeline = dynamic(() =>
  import("./RecentTimeline").then((m) => m.RecentTimeline),
);
const SharedLinks = dynamic(() =>
  import("./SharedLinks").then((m) => m.SharedLinks),
);

type TabViewProps = {
  tab: DashboardTab;
  query: string;
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  selected: string | null;
  setSelected: (id: string | null) => void;
  openPicker: () => void;
};

const TabView = ({
  tab,
  query,
  view,
  setView,
  selected,
  setSelected,
  openPicker,
}: TabViewProps) => {
  const items = useFileSystemStore(useShallow(selectItems));
  const createFolder = useFileSystemStore((state) => state.createFolder);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  const onCreateFolder = async (name: string) => {
    await createFolder(name);
    setCreateFolderOpen(false);
  };

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
        hideUpload
        openPicker={openPicker}
      >
        <TrashView view={view} />
      </TabShell>
    );
  }

  // my-drive default
  return (
    <TabShell
      crumbs={["Home", "My Drive"]}
      breadcrumb={<DriveBreadcrumb />}
      title="My Drive"
      subtitle="All your files, folders and shared workspaces in one place."
      view={view}
      setView={setView}
      openPicker={openPicker}
      actions={
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setCreateFolderOpen(true)}
        >
          <FolderPlus className="h-4 w-4" /> New folder
        </Button>
      }
    >
      <DialogWithInput
        title="New folder"
        placeholder="Enter folder name"
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onSubmit={(name) => void onCreateFolder(name)}
      />

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          {/* <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Files
          </h2> */}
          <span className="text-xs text-muted-foreground">
            {items.length} items
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
};

export { TabView };