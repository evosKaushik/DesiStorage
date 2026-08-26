"use client";

import { useState } from "react";
import {
  Home,
  Star,
  Clock,
  Users,
  Trash2,
  HardDrive,
  Share2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useUploads } from "./UploadContext";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import type { DashboardTab } from "./DashboardShell";
import useUserStore, { selectUser } from "@/store/useUserStore";
import UseStorageDetails from "@/hooks/useStorageDetails";

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

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { openPicker } = useUploads();
  const user = useUserStore(selectUser);


  const { formattedStorageLimit, formattedStorageUsed, percentageUsed } =
    UseStorageDetails(user?.storageUsed, user?.storageLimit);

  const pathname = usePathname();
  const params = useSearchParams();
  const activeTab: DashboardTab =
    params.get("tab") === null
      ? ("my-drive" as DashboardTab)
      : (params.get("tab") as DashboardTab);
  const isProfile = pathname === "/profile";

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-border/60 bg-card/40 transition-all duration-300 md:flex",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      <div className="flex h-16 items-center gap-2 px-4">
        <Logo className="h-8 w-8 xs:h-10 xs:w-10" isText={!collapsed} />
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

      <div className={cn("border-t border-border/60 p-4", collapsed && "px-2")}>
        {!collapsed ? (
          <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <HardDrive className="h-4 w-4 text-primary" /> Storage
            </div>
            <div className="mt-3">
              {user ? (
                <>
                  <Progress value={percentageUsed} className="h-1.5" />
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {formattedStorageUsed} of {formattedStorageLimit}
                    </span>
                    <span className="font-semibold text-foreground">
                      {Math.round((user.storageUsed / user.storageLimit) * 100)}
                      %
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Progress value={0} className="h-1.5" />
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Sign in to see storage</span>
                    <span className="font-semibold text-foreground">—</span>
                  </div>
                </>
              )}
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
  );
}
