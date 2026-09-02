"use client";

import {
  Suspense,
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { UploadProvider } from "./UploadContext";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";

const UploadPanel = dynamic(
  () => import("./UploadPanel").then((m) => m.UploadPanel),
  { ssr: false },
);

export type DashboardTab =
  | "home"
  | "my-drive"
  | "shared"
  | "recent"
  | "starred"
  | "links"
  | "trash";

export const DEFAULT_TAB: DashboardTab = "my-drive";

type SearchCtx = { query: string; setQuery: (v: string) => void };
const SearchCtx = createContext<SearchCtx | null>(null);

function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  return (
    <SearchCtx.Provider value={{ query, setQuery }}>
      {children}
    </SearchCtx.Provider>
  );
}

export function useDashboardSearch() {
  const ctx = useContext(SearchCtx);
  if (!ctx)
    throw new Error("useDashboardSearch must be used inside DashboardShell");
  return ctx;
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <UploadProvider>
      <SearchProvider>
        <div className="relative flex h-screen w-full overflow-hidden bg-background text-foreground">
          <Suspense fallback={null}>
            <DashboardSidebar />
          </Suspense>
          <div className="flex min-w-0 flex-1 flex-col  sm:ml-18 md:ml-0">
            <DashboardHeader />
            <main className="min-w-0 flex-1 overflow-y-auto">
              
              {children}
            </main>
          </div>
        </div>
      </SearchProvider>
      <UploadPanel />
    </UploadProvider>
  );
}
