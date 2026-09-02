"use client";

import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
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

const StorageTab = dynamic(() =>
  import("./tabs/StorageTab").then((m) => m.StorageTab),
);
const SecurityTab = dynamic(() =>
  import("./tabs/SecurityTab").then((m) => m.SecurityTab),
);
const SessionsTab = dynamic(() =>
  import("./tabs/SessionsTab").then((m) => m.SessionsTab),
);
const NotificationsTab = dynamic(() =>
  import("./tabs/NotificationsTab").then((m) => m.NotificationsTab),
);
const SupportTab = dynamic(() =>
  import("./tabs/SupportTab").then((m) => m.SupportTab),
);

const TABS = ["profile", "storage", "security", "sessions", "notifications", "support"] as const;
type TabValue = (typeof TABS)[number];

function isValidTab(v: string | null): v is TabValue {
  return v !== null && (TABS as readonly string[]).includes(v);
}

export function ProfileTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("tab");
  const activeTab: TabValue = isValidTab(raw) ? raw : "profile";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "profile") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    router.replace(`/profile?${params.toString()}`, { scroll: false });
  }

  return (
    <Tabs value={activeTab} onValueChange={handleChange} className="mt-8 flex flex-col">
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
