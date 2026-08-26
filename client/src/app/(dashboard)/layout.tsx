import { Suspense, type ReactNode } from "react";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";
import { AuthGuard } from "@/components/AuthGuard";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <AuthGuard>
      <Suspense fallback={null}>
        <DashboardShell>{children}</DashboardShell>
      </Suspense>
    </AuthGuard>
  );
};

export default Layout;
