import { ReactNode } from "react";
import { AuthRedirectGuard } from "@/components/AuthRedirectGuard";

// Public-only auth routes (login, register, forgot-password).
// Logged-in users are sent to /dashboard.
const Layout = ({ children }: { children: ReactNode }) => {
  return <AuthRedirectGuard>{children}</AuthRedirectGuard>;
};

export default Layout;
