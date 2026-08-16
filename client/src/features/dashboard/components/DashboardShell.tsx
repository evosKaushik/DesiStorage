"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  Search,
  Home,
  Star,
  Clock,
  Users,
  Trash2,
  HardDrive,
  Share2,
  Settings,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { UploadProvider, useUploads } from "./UploadContext";
import { UploadPanel } from "./UploadPanel";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { NotificationsPopover } from "./NotificationsPopover";
import ThemeToggler from "@/components/ThemeToggle";
import { ProfileMenu } from "./ProfileMenu";
import Logo from "@/components/Logo";

export type DashboardTab =
  | "home"
  | "my-drive"
  | "shared"
  | "recent"
  | "starred"
  | "links"
  | "trash";

export const DEFAULT_TAB: DashboardTab = "my-drive";

const NAV: {
  id: DashboardTab;
  label: string;
  icon: typeof Home;
  count: number | null;
}[] = [
  { id: "home", label: "Home", icon: Home, count: null },
  { id: "my-drive", label: "My Drive", icon: HardDrive, count: null },
  { id: "shared", label: "Shared with me", icon: Users, count: 12 },
  { id: "recent", label: "Recent", icon: Clock, count: null },
  { id: "starred", label: "Starred", icon: Star, count: 5 },
  { id: "links", label: "Shared links", icon: Share2, count: 4 },
  { id: "trash", label: "Trash", icon: Trash2, count: null },
];

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

/** Same chrome as the drive dashboard (sidebar + header), for secondary pages. */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <UploadProvider>
      <SearchProvider>
        <Shell>{children}</Shell>
      </SearchProvider>
      <UploadPanel />
    </UploadProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { query, setQuery } = useDashboardSearch();
  const { openPicker } = useUploads();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeTab: DashboardTab =
    params.get("tab") === null
      ? DEFAULT_TAB
      : (params.get("tab") as DashboardTab);
  const isProfile = pathname === "/profile";

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background text-foreground">
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-border/60 bg-card/40 transition-all duration-300 md:flex",
          collapsed ? "w-[72px]" : "w-[260px]",
        )}
      >
        <div className="flex h-16 items-center gap-2 px-4">
          <Logo
            className="h-8 w-8 xs:h-10 xs:w-10"
            isText={collapsed ? false : true}
          />
        </div>

        <div className="px-3">
          <Button
            onClick={openPicker}
            className={cn(
              "h-11 w-full justify-center gap-2 rounded-xl shadow-sm",
              collapsed && "px-0",
            )}
          >
            <span className="text-lg leading-none">+</span>
            {!collapsed && <span>New</span>}
          </Button>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-0.5 px-2">
          {NAV.map((item) => {
            const active = pathname === "/dashboard" && activeTab === item.id;
            return (
              <Link
                key={item.id}
                href={`/dashboard?tab=${item.id}`}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  collapsed && "justify-center px-2",
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.count != null && (
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                          active
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {item.count}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}

          <div className="my-2 border-t border-border/60" />

          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isProfile
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
              collapsed && "justify-center px-2",
            )}
            title={collapsed ? "Profile & settings" : undefined}
          >
            <UserRound className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && (
              <span className="flex-1 text-left">Profile & settings</span>
            )}
          </Link>
        </nav>

        <div
          className={cn("border-t border-border/60 p-4", collapsed && "px-2")}
        >
          {!collapsed ? (
            <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <HardDrive className="h-4 w-4 text-primary" /> Storage
              </div>
              <div className="mt-3">
                <Progress value={64} className="h-1.5" />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>128 GB of 200 GB</span>
                  <span className="font-semibold text-foreground">64%</span>
                </div>
              </div>
              <Button size="sm" variant="outline" className="mt-3 w-full">
                Upgrade plan
              </Button>
            </div>
          ) : (
            <div className="flex justify-center">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex h-10 items-center justify-center border-t border-border/60 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {collapsed ? "→" : "← Collapse"}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 justify-between shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-12">
          <div className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files, folders, people…"
              className="h-10 rounded-xl border-border/60 bg-muted/40 pl-9 focus-visible:ring-primary/30"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
            >
              <SlidersHorizontal className="h-4.5 w-4.5" />
            </Button>
            <ThemeToggler />
            <NotificationsPopover />
            <Link
              href="/profile"
              aria-label="Settings"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "text-primary",
              )}
            >
              <Settings className="h-4.5 w-4.5" />
            </Link>
            <ProfileMenu />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
