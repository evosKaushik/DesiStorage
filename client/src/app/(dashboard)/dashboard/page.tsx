"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUploads } from "@/features/dashboard/components/UploadContext";
import {
  useDashboardSearch,
  type DashboardTab,
} from "@/features/dashboard/components/DashboardShell";
import { FILES, SHARED_FILES, TRASH_FILES } from "@/features/dashboard/data/dashboard";
import { TabView } from "@/features/dashboard/components/drive/TabView";
import { PreviewPane } from "@/features/dashboard/components/drive/PreviewPane";

const VALID_TABS = new Set<DashboardTab>([
  "home",
  "my-drive",
  "shared",
  "recent",
  "starred",
  "links",
  "trash",
]);

export default function DashboardPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<string | null>("f2");
  const { query } = useDashboardSearch();
  const { openPicker } = useUploads();
  const params = useSearchParams();
  const rawTab = params.get("tab");
  const tab: DashboardTab =
    rawTab !== null && VALID_TABS.has(rawTab as DashboardTab)
      ? (rawTab as DashboardTab)
      : "my-drive";

  const selectedFile = useMemo(
    () =>
      [...FILES, ...SHARED_FILES, ...TRASH_FILES].find(
        (f) => f.id === selected,
      ) ?? null,
    [selected],
  );

  return (
    <div className="flex min-h-full">
      <div className="min-w-0 flex-1 px-4 py-6 md:px-8">
        <TabView
          tab={tab}
          query={query}
          view={view}
          setView={setView}
          selected={selected}
          setSelected={setSelected}
          openPicker={openPicker}
        />
      </div>

      {selectedFile && (
        <PreviewPane file={selectedFile} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
