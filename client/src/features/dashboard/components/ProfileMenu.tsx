"use client";
import {
  User,
  Settings,
  HardDrive,
  LifeBuoy,
  LogOut,
  CreditCard,
  ShieldCheck,
  Moon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function ProfileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className="flex items-center rounded-full outline-none ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
            aria-label="Open profile menu"
          >
            <Avatar className="h-9 w-9 border border-border/60">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                AR
              </AvatarFallback>
            </Avatar>
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-72 p-0">
        <div className="flex items-center gap-3 border-b border-border/60 p-3">
          <Avatar className="h-11 w-11">
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              AR
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">Arjun Rathore</div>
            <div className="truncate text-xs text-muted-foreground">
              arjun@desistorage.in
            </div>
          </div>
        </div>

        <div className="border-b border-border/60 px-3 py-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <HardDrive className="h-3.5 w-3.5 text-primary" /> Storage
            </span>
            <span className="text-muted-foreground">128 / 200 GB</span>
          </div>
          <Progress value={64} className="h-1.5" />
          <Link
            href="/profile"
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "mt-3 w-full")}
          >
            Manage account
          </Link>
        </div>

        <DropdownMenuLabel className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Account
        </DropdownMenuLabel>
        <DropdownMenuItem>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
        // onClick={() => toast.info("Settings coming soon")}
        >
          <Settings className="mr-2 h-4 w-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem 
        // onClick={() => toast.info("Billing portal opening…")}
        >
          <CreditCard className="mr-2 h-4 w-4" /> Billing & plan
        </DropdownMenuItem>
        <DropdownMenuItem
        //   onClick={() => toast.info("Security center opening…")}
        >
          <ShieldCheck className="mr-2 h-4 w-4" /> Security
        </DropdownMenuItem>
        <DropdownMenuItem
        //   onClick={() => toast.info("Appearance controls in header")}
        >
          <Moon className="mr-2 h-4 w-4" /> Appearance
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem >
          <Link
            href="/profile"
            // search={{ tab: "support" } as never}
            className="cursor-pointer"
          >
            <LifeBuoy className="mr-2 h-4 w-4" /> Help & support
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
        //   onClick={() => toast.success("Signed out from this device")}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
