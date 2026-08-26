"use client";

import {
  User,
  HardDrive,
  Monitor,
  LifeBuoy,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileTab } from "./tabs/ProfileTab";
import { StorageTab } from "./tabs/StorageTab";
import { SecurityTab } from "./tabs/SecurityTab";
import { SessionsTab } from "./tabs/SessionsTab";
import { NotificationsTab } from "./tabs/NotificationsTab";
import { SupportTab } from "./tabs/SupportTab";

export function ProfileTabs() {
  return (
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
  );
}
