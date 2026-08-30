"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SectionCard } from "../SectionCard";
import {
  getAllSessionsApi,
  logoutAllSessionsApi,
  logoutSessionById,
} from "../../api";
import type { Sessions } from "../../api";
import { getTimeAgo } from "@/utils/time";
import GetIconByDeviceName, { DeviceName } from "../GetIconByDeviceName";
import { GroupSkeleton } from "@/components/GroupSkeleton";
import { showToastWithDescription } from "@/utils/toast";

export function SessionsTab() {
  const [sessions, setSessions] = useState<Sessions[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [revokingAll, setRevokingAll] = useState<boolean>(false);
  const [revokingIds, setRevokingIds] = useState<string[]>([]);
  const listRef = useRef<HTMLUListElement>(null);

  const fetchAllSession = async () => {
    setIsLoading(true);
    try {
      const data = await getAllSessionsApi();
      if (!data.success) {
        setSessions(null);
        showToastWithDescription.error({
          title: "Failed to load sessions",
          description: data.error.message,
        });
        return;
      }
      setSessions(data.data);
    } catch {
      setSessions(null);
      showToastWithDescription.error({
        title: "Failed to load sessions",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSession();
  }, []);

  useEffect(() => {
    if (isLoading || !sessions || !listRef.current) {
      return;
    }

    const items = gsap.utils.toArray<HTMLElement>(
      listRef.current.querySelectorAll("li"),
    );

    const ctx = gsap.context(() => {
      gsap.fromTo(
        listRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
      );
      if (items.length > 0) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.08,
            ease: "power2.out",
          },
        );
      }
    }, listRef);

    return () => ctx.revert();
  }, [isLoading, sessions]);

  const revoke = async (id: string) => {
    setRevokingIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    try {
      const data = await logoutSessionById(id);
      if (!data.success) {
        showToastWithDescription.error({
          title: "Failed to sign out device",
          description: data.error.message,
        });
        return;
      }
      showToastWithDescription.success({
        title: "Device signed out",
        description: "This device can no longer access your account.",
      });
      setSessions((prev) => (prev ? prev.filter((s) => s.id !== id) : null));
    } catch {
      showToastWithDescription.error({
        title: "Failed to sign out device",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setRevokingIds((prev) => prev.filter((s) => s !== id));
    }
  };

  const revokeAll = async () => {
    const hasOtherSessions = sessions?.some((s) => !s.isCurrent) ?? false;

    if (!hasOtherSessions) {
      showToastWithDescription.info({
        title: "No other active sessions",
        description: "You don't have any other signed-in devices.",
      });
      return;
    }

    setRevokingAll(true);
    try {
      const data = await logoutAllSessionsApi();
      if (!data.success) {
        showToastWithDescription.error({
          title: "Failed to sign out other devices",
          description: data.error.message,
        });
        return;
      }
      showToastWithDescription.success({
        title: "Signed out other devices",
        description: "Other devices can no longer access your account.",
      });
      setSessions((prev) =>
        prev ? prev.filter((s) => s.isCurrent) : null,
      );
    } catch {
      showToastWithDescription.error({
        title: "Failed to sign out other devices",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setRevokingAll(false);
    }
  };

  return (
    <SectionCard
      title="Active sessions"
      description="Devices currently signed in to your DesiStorage account."
      right={
        <AlertDialog>
          <AlertDialogTrigger
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out all other devices
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Sign out of all other devices?
              </AlertDialogTitle>
              <AlertDialogDescription>
                You&apos;ll stay signed in on this device. Everywhere else will
                need to log in again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={revokeAll}
                disabled={revokingAll}
                className="disabled:pointer-events-none disabled:opacity-60"
              >
                {revokingAll ? "Signing out..." : "Sign out"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      }
    >
      {isLoading ? (
        <GroupSkeleton count={3} />
      ) : sessions && sessions.length > 0 ? (
        <ul ref={listRef} className="divide-y divide-border/60">
          {sessions?.map((s) => (
            <li key={s.id} className="flex items-center gap-4 py-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <GetIconByDeviceName
                  deviceName={(s.device ?? "Desktop") as DeviceName}
                  className="h-5 w-5"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{s.device}</span>
                  {s.isCurrent && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400">
                      This device
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {s.browserVersion} · {s.operatingSystem}
                </div>
                <div className="text-xs text-muted-foreground">
                  {s.state} · {s.ip.toString()} ·{" "}
                  {s.isCurrent ? "Active now" : getTimeAgo(s.lastActiveAt)}
                </div>
              </div>
              {!s.isCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => revoke(s.id)}
                  disabled={revokingIds.includes(s.id)}
                >
                  {revokingIds.includes(s.id) ? "Signing out..." : "Sign out"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <LogOut className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">No active sessions</p>
        </div>
      )}
    </SectionCard>
  );
}
