"use client";

import { ProfileHeader } from "./ProfileHeader";
import { ProfileTabs } from "./ProfileTabs";

export function ProfilePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <ProfileHeader />
      <ProfileTabs />
    </div>
  );
}
