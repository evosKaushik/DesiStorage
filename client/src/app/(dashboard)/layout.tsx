import { type ReactNode } from "react";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { AuthGuard } from "@/components/AuthGuard";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
};

export default Layout;
