"use client";

import {
  ArrowLeft,
  User,
  HardDrive,
  Monitor,
  LifeBuoy,
  ShieldCheck,
  Bell,
  Camera,
  Check,
} from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ProfileTab } from "./tabs/ProfileTab";
import { StorageTab } from "./tabs/StorageTab";
import { SecurityTab } from "./tabs/SecurityTab";
import { SessionsTab } from "./tabs/SessionsTab";
import { NotificationsTab } from "./tabs/NotificationsTab";
import { SupportTab } from "./tabs/SupportTab";

export function ProfilePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
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
              AR
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
            Arjun Rathore
          </h1>
          <p className="text-sm text-muted-foreground">
            arjun@desistorage.in · Mumbai, IN
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="h-3 w-3" /> Pro plan
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Check className="h-3 w-3 text-emerald-500" /> Email verified
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Check className="h-3 w-3 text-emerald-500" /> 2FA on
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="mt-8 flex flex-col">
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-muted/40 p-1">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="storage">
            <HardDrive className="mr-2 h-4 w-4" />
            Storage & plan
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Monitor className="mr-2 h-4 w-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="support">
            <LifeBuoy className="mr-2 h-4 w-4" />
            Support
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="storage" className="mt-6">
          <StorageTab />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <SessionsTab />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="support" className="mt-6">
          <SupportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
