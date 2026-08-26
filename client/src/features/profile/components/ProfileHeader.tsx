"use client";

import {
  ArrowLeft,
  Camera,
  Check,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import useUserStore, { selectUser } from "@/store/useUserStore";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileHeader() {
  const user = useUserStore(selectUser);
  if (!user) return null;

  return (
    <>
      <Link
        href="/dashboard"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mb-6 -ml-2 gap-2 text-muted-foreground",
        )}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Drive
      </Link>

      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="relative">
          <Avatar className="h-20 w-20 border-2 border-border/60">
            <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <button
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm hover:brightness-110"
            aria-label="Change photo"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {user.fullName}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="h-3 w-3" /> Pro plan
            </Badge>
            {user.isEmailVerified && (
              <Badge variant="secondary" className="gap-1">
                <Check className="h-3 w-3 text-emerald-500" /> Email verified
              </Badge>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
