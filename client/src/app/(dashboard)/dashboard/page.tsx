"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { useUploads } from "@/features/dashboard/components/UploadContext";
import useFileSystemStore, { selectFiles } from "@/store/useFileSystemStore";
import useUserStore, { selectUser } from "@/store/useUserStore";
import { formatBytes } from "@/lib/format";
import { useDashboardSearch } from "@/features/dashboard/context/dashboard-search";
import {
  VALID_TABS,
  type DashboardTab,
} from "@/features/dashboard/types/dashboard-tabs";
import type { FileRow } from "@/features/dashboard/types/types";
import { kindFromMimeType } from "@/features/dashboard/components/drive/file-meta";
import {
  FILES,
  SHARED_FILES,
  TRASH_FILES,
} from "@/features/dashboard/data/dashboard";
import { TabView } from "@/features/dashboard/components/drive/TabView";
import { FilePreviewProvider } from "@/features/dashboard/components/FilePreviewModel";

const PreviewPane = dynamic(
  () =>
    import("@/features/dashboard/components/drive/PreviewPane").then(
      (m) => m.PreviewPane,
    ),
  { loading: () => <div className="w-80 shrink-0" /> },
);
const VerifyEmailBanner = dynamic(() =>
  import("@/features/auth/components/VerifyEmailBanner").then((m) => m.default),
);

export default function DashboardPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<string | null>(null);
  const { query } = useDashboardSearch();
  const { openPicker } = useUploads();
  const storeFiles = useFileSystemStore(useShallow(selectFiles));
  const loadFolder = useFileSystemStore((s) => s.loadFolder);
  const user = useUserStore(selectUser);
  const params = useSearchParams();
  const rawTab = params.get("tab");
  const tab: DashboardTab =
    rawTab !== null && VALID_TABS.has(rawTab as DashboardTab)
      ? (rawTab as DashboardTab)
      : "my-drive";

  // On first load, populate "My Drive" with the contents of the user's root
  // folder ({{BASE_URL}}/folders/:rootFolderId).
  useEffect(() => {
    if (tab !== "my-drive" || !user?.rootFolderId) return;

    void loadFolder(user.rootFolderId);
  }, [tab, user?.rootFolderId, loadFolder]);

  const selectedFile = useMemo(() => {
    const legacy = [...FILES, ...SHARED_FILES, ...TRASH_FILES].find(
      (f) => f.id === selected,
    );
    if (legacy) return legacy;

    const storeItem = storeFiles.find((f) => f.id === selected);
    if (!storeItem) return null;

    return {
      id: storeItem.id,
      name: storeItem.name,
      kind: kindFromMimeType(storeItem.mimeType),
      size: formatBytes(storeItem.size),
      modified: storeItem.updatedAt,
      owner: "You",
      url: storeItem.url,
      previewType: storeItem.previewType,
    } satisfies FileRow;
  }, [selected, storeFiles]);

  return (
    <>
      <div className="flex min-h-full">
        <FilePreviewProvider>
          <div className="min-w-0 flex-1 px-4 py-6 md:px-8">
            <VerifyEmailBanner />
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
        </FilePreviewProvider>

        {selectedFile && (
          <PreviewPane file={selectedFile} onClose={() => setSelected(null)} />
        )}
      </div>
    </>
  );
}
