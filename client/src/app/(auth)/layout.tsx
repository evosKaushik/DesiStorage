import { ReactNode } from "react";
import { AuthRedirectGuard } from "@/components/AuthRedirectGuard";

const Layout = async ({ children }: { children: ReactNode }) => {
  return <AuthRedirectGuard>{children}</AuthRedirectGuard>;
};

export default Layout;
