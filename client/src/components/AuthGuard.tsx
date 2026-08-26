"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side auth guard for protected routes.
 *
 * Behaviour:
 *  1. On mount, fires `GET /api/v1/auth` to validate the session cookie.
 *  2. While the check is in-flight, renders a full-screen spinner.
 *  3. If the session is valid, renders `children`.
 *  4. If the session is invalid / absent, redirects to `/login`.
 *
 * This prevents both the flash of protected content AND false redirects
 * during the initial hydration window.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, hydrated } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  // Still checking session — show skeleton, not protected content
  if (!hydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Session invalid — useEffect will redirect, render nothing to avoid flash
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
