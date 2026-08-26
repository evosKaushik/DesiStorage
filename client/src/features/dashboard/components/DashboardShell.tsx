"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { UploadProvider } from "./UploadContext";
import { UploadPanel } from "./UploadPanel";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";

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
          <DashboardSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <DashboardHeader />
            <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </SearchProvider>
      <UploadPanel />
    </UploadProvider>
  );
}
