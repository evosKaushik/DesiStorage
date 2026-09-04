"use client";

import { Search, Settings, SlidersHorizontal } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { NotificationsPopover } from "./NotificationsPopover";
import ThemeToggler from "@/components/ThemeToggle";
import { ProfileMenu } from "./ProfileMenu";
import { useDashboardSearch } from "./DashboardShell";

export function DashboardHeader() {
  const { query, setQuery } = useDashboardSearch();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-12">
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
  );
}
