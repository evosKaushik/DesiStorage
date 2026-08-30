"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface AuthRedirectGuardProps {
  children: React.ReactNode;
}

/**
 * Reverse auth guard for public-only routes (login, register, forgot-password).
 * If the user already has a valid session, redirects them to /dashboard.
 * Otherwise renders children normally.
 */
export function AuthRedirectGuard({ children }: AuthRedirectGuardProps) {
  const { user, hydrated } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && user) {
      router.replace("/dashboard");
    }
  }, [hydrated, user, router]);

  if (!hydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}
