import { redirect } from "next/navigation";

import { verifyResetTokenApi } from "@/features/auth/api";
import ResetPasswordForm from "./ResetPasswordForm";

type Props = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function Page({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/forgot-password");
  }

  const result = await verifyResetTokenApi({
    token,
  });

  if (!result.success) {
    redirect("/forgot-password");
  }

  return <ResetPasswordForm token={token} />;
}
