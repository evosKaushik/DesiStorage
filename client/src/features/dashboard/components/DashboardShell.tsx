"use client";

import { Suspense, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { UploadProvider } from "./UploadContext";
import { SearchProvider } from "../context/dashboard-search";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";

const UploadPanel = dynamic(
  () => import("./UploadPanel").then((m) => m.UploadPanel),
  { ssr: false },
);

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