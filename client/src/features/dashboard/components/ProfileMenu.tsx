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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import useUserStore, { selectUser } from "@/store/useUserStore";
import { logoutUserApi } from "@/features/auth/api";
import Image from "next/image";
import { ShimmerImage } from "@/components/ShimmerImage";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileMenu() {
  const user = useUserStore(selectUser);
  const logout = useUserStore((s) => s.logout);
  const router = useRouter();

  const name = user?.fullName ?? "Guest";
  const email = user?.email ?? "";
  const initials = getInitials(name);
  const storageUsedGB = user
    ? (user.storageUsed / 1_073_741_824).toFixed(0)
    : "0";
  const storageLimitGB = user
    ? (user.storageLimit / 1_073_741_824).toFixed(0)
    : "200";
  const storagePct = user
    ? Math.round((user.storageUsed / user.storageLimit) * 100)
    : 0;

  async function handleLogout() {
    await logoutUserApi(); // best-effort: clear session on server
    logout(); // clear local state
    toast.success("Logged out successfully");
    router.push("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center rounded-full outline-none ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
        aria-label="Open profile menu"
      >
        <Avatar className="h-9 w-9 border border-border/60 rounded-full overflow-hidden">
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            <ShimmerImage
              src={user?.avatar ?? "/default-avatar.png"}
              alt="User avatar"
              fill
              className="object-cover"
            />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-0">
        <div className="flex items-center gap-3 border-b border-border/60 p-3">
          <Avatar className="h-11 w-11 rounded-full overflow-hidden">
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              <ShimmerImage
                src={user?.avatar ?? "/default-avatar.png"}
                alt="User avatar"
                fill
                className="object-cover"
              />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {email}
            </div>
          </div>
        </div>

        <div className="border-b border-border/60 px-3 py-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <HardDrive className="h-3.5 w-3.5 text-primary" /> Storage
            </span>
            <span className="text-muted-foreground">
              {storageUsedGB} / {storageLimitGB} GB
            </span>
          </div>
          <Progress value={storagePct} className="h-1.5" />
          <Link
            href="/profile"
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "mt-3 w-full",
            )}
          >
            Manage account
          </Link>
        </div>

        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Account
          </DropdownMenuLabel>
          <DropdownMenuItem>
            <Link
              href="/profile"
              className="cursor-pointer flex items-center gap-2"
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className="mr-2 h-4 w-4" /> Billing & plan
          </DropdownMenuItem>
          <DropdownMenuItem>
            <ShieldCheck className="mr-2 h-4 w-4" /> Security
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Moon className="mr-2 h-4 w-4" /> Appearance
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link
            href="/profile"
            className="cursor-pointer flex items-center gap-2"
          >
            <LifeBuoy className="mr-2 h-4 w-4" />
            <span>Help & support</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
