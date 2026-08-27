"use client";

import { useState } from "react";
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
import { SESSIONS, type Session } from "../../data/sessions";
import { SectionCard } from "../SectionCard";

export function SessionsTab() {
  const [sessions, setSessions] = useState<Session[]>(SESSIONS);

  const revoke = (id: string) => {
    setSessions((s) => s.filter((x) => x.id !== id));
  };
  const revokeAll = () => {
    setSessions((s) => s.filter((x) => x.current));
  };

  return (
    <SectionCard
      title="Active sessions"
      description="Devices currently signed in to your DesiStorage account."
      right={
        <AlertDialog>
          <AlertDialogTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
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
              <AlertDialogAction onClick={revokeAll}>
                Sign out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      }
    >
      <ul className="divide-y divide-border/60">
        {sessions.map((s) => (
          <li key={s.id} className="flex items-center gap-4 py-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <s.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{s.device}</span>
                {s.current && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400">
                    This device
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{s.browser}</div>
              <div className="text-xs text-muted-foreground">
                {s.location} · {s.ip} · {s.lastActive}
              </div>
            </div>
            {!s.current && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => revoke(s.id)}
              >
                Sign out
              </Button>
            )}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
