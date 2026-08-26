"use client";

import { Bell, FileText, UserPlus, Share2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

type N = {
  id: string;
  title: string;
  body: string;
  time: string;
  icon: typeof Bell;
  tone: "info" | "success" | "warning";
  unread: boolean;
};

const SEED: N[] = [
  { id: "n1", title: "Ananya shared a folder", body: "“Design System” was shared with you.", time: "2m ago", icon: Share2, tone: "info", unread: true },
  { id: "n2", title: "Upload complete", body: "Hero-banner-v3.png finished uploading.", time: "18m ago", icon: CheckCircle2, tone: "success", unread: true },
  { id: "n3", title: "New comment", body: "Rahul commented on Investor-deck.pdf", time: "1h ago", icon: FileText, tone: "info", unread: true },
  { id: "n4", title: "Storage almost full", body: "You've used 64% of your 200 GB plan.", time: "3h ago", icon: AlertTriangle, tone: "warning", unread: false },
  { id: "n5", title: "Priya joined workspace", body: "Priya S. accepted your invitation.", time: "Yesterday", icon: UserPlus, tone: "info", unread: false },
];

export function NotificationsPopover() {
  const [items, setItems] = useState<N[]>(SEED);
  const unread = items.filter((i) => i.unread).length;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative text-muted-foreground" aria-label="Notifications">
            <Bell className="h-4.5 w-4.5" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unread}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Notifications</div>
            <div className="text-xs text-muted-foreground">{unread} unread</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              setItems((prev) => prev.map((i) => ({ ...i, unread: false })));
            //   toast.success("All notifications marked as read");
            }}
          >
            Mark all read
          </Button>
        </div>
        <ScrollArea className="max-h-[420px]">
          <ul className="divide-y divide-border/60">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "flex gap-3 px-4 py-3 transition-colors hover:bg-accent/50",
                  n.unread && "bg-primary/[0.03]",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    n.tone === "success" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    n.tone === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    n.tone === "info" && "bg-primary/10 text-primary",
                  )}
                >
                  <n.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium leading-tight">{n.title}</div>
                    {n.unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground/80">{n.time}</div>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <div className="border-t border-border/60 p-2">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            View all activity
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
