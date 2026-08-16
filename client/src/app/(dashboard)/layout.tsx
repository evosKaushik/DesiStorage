import { Suspense, type ReactNode } from "react";
import { DashboardShell } from "@/features/dashboard/components/DashboardShell";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <Suspense fallback={null}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
};

export default Layout;
