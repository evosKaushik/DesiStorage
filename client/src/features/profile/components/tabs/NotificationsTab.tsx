import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { SectionCard } from "../SectionCard";

const PREFERENCES = [
  {
    key: "shares",
    label: "File & folder shares",
    desc: "Someone shares a file or folder with you.",
  },
  {
    key: "comments",
    label: "Comments & mentions",
    desc: "You're @mentioned or someone replies to you.",
  },
  {
    key: "uploads",
    label: "Upload activity",
    desc: "Uploads finish, fail or need attention.",
  },
  {
    key: "storage",
    label: "Storage warnings",
    desc: "You're running low on space.",
  },
  {
    key: "security",
    label: "Security alerts",
    desc: "New sign-ins and suspicious activity.",
  },
  {
    key: "product",
    label: "Product updates",
    desc: "New features and occasional tips.",
  },
];

export function NotificationsTab() {
  return (
    <SectionCard
      title="Notification preferences"
      description="Choose what you're notified about and where."
    >
      <div className="space-y-4">
        {PREFERENCES.map((r, i) => (
          <div key={r.key}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.desc}</div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Email <Switch defaultChecked={i < 4} />
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Push <Switch defaultChecked={i < 3} />
                </label>
              </div>
            </div>
            {i < 5 && <Separator className="mt-4" />}
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <Button>Save preferences</Button>
        </div>
      </div>
    </SectionCard>
  );
}
