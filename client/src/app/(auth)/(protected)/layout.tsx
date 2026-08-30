"use client";

import { ReactNode } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AuthRedirectGuard } from "@/components/AuthRedirectGuard";
import useUserStore, { selectIsVerified } from "@/store/useUserStore";

// Authenticated-only auth routes (e.g. verify-email).
// Requires a valid session (AuthGuard); already-verified users are bounced
// back to the dashboard instead of re-entering the verification flow.
const Layout = ({ children }: { children: ReactNode }) => {
  const isVerified = useUserStore(selectIsVerified);
  return isVerified ? (
    <AuthRedirectGuard>{children}</AuthRedirectGuard>
  ) : (
    <AuthGuard>{children}</AuthGuard>
  );
};

export default Layout;
