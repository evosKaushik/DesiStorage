"use client";

import { useState } from "react";
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordInput from "@/features/auth/components/PasswordValidator";
import {
  ResetPasswordSchema,
  resetPasswordSchema,
} from "@/features/auth/schema/reset-password.schema";
import { resetPasswordApi } from "@/features/auth/api";
import { showToastWithDescription } from "@/components/ShowToastWithDescription";
import { cn } from "@/lib/utils";

type Props = {
  token: string;
};

export default function ResetPasswordForm({ token }: Props) {
  const router = useRouter();
  const [show, setShow] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  const onSubmit = async ({ newPassword: password }: ResetPasswordSchema) => {
    const result = await resetPasswordApi({ token, newPassword: password });

    if (!result.success) {
      showToastWithDescription.error({
        title: "Couldn't reset password",
        description: result.error.message,
      });
      return;
    }

    showToastWithDescription.success({
      title: "Password reset",
      description:
        "Your password has been updated. You can now sign in with your new password.",
    });
    router.push("/login");
  };

  return (
    <AuthLayout
      eyebrow="Secure password reset"
      title="Set a new password"
      subtitle="Choose a strong, unique password to protect your encrypted workspace."
      footer={
        <p>
          Changed your mind?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="newPassword"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
              {...register("newPassword")}
              className={cn(
                "h-11 rounded-xl pl-9 pr-10",
                errors.newPassword && "input-error-state",
              )}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {show ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {newPassword && (
            <PasswordInput
              password={newPassword}
              isShowErrors={!!errors.newPassword}
            />
          )}
          {errors.newPassword && (
            <p className="text-sm text-destructive">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              {...register("confirmPassword")}
              className={cn(
                "h-11 rounded-xl pl-9 pr-10",
                errors.confirmPassword && "input-error-state",
              )}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {show ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-xl text-sm shadow-sm"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Resetting password…" : "Reset password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
