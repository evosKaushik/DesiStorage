"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { showToastWithDescription } from "@/utils/toast";
import useUserStore, { selectUserEmail } from "@/store/useUserStore";
import { verifyEmailApi, sendOtpToEmailApi } from "@/features/auth/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  verifyEmailSchema,
  type VerifyEmailSchema,
} from "@/features/auth/schema/verify-email.schema";

const LENGTH = 6;

function Page() {
  const router = useRouter();
  const userEmail = useUserStore(selectUserEmail);
  const updateUser = useUserStore((s) => s.updateUser);
  const target = userEmail;

  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [verified, setVerified] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(30);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const {
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<VerifyEmailSchema>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { otp: "" },
  });

  const otp = digits.join("");

  // Keep the RHF field in sync with the visible digits so the zod resolver
  // validates exactly what's on screen at submit time. `shouldValidate:false`
  // keeps errors hidden until the user actually submits the form.
  useEffect(() => {
    setValue("otp", otp, { shouldValidate: false });
  }, [otp, setValue]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function setAt(index: number, value: string) {
    setServerError(null);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function onChange(index: number, raw: string) {
    setServerError(null);
    const value = raw.replace(/\D/g, "");

    if (!value) {
      setAt(index, "");
      return;
    }

    // Paste: "123456" or a partial string fills consecutive boxes
    if (value.length > 1) {
      const chars = value.slice(0, LENGTH - index).split("");
      setDigits((prev) => {
        const next = [...prev];
        chars.forEach((c, i) => (next[index + i] = c));
        return next;
      });
      inputs.current[Math.min(index + chars.length, LENGTH - 1)]?.focus();
      return;
    }

    // Single keystroke
    setAt(index, value);
    if (index < LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        setAt(index, "");
      } else if (index > 0) {
        inputs.current[index - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < LENGTH - 1)
      inputs.current[index + 1]?.focus();
  }

  async function onSubmit(data: VerifyEmailSchema) {
    setServerError(null);

    const result = await verifyEmailApi(data);

    if (!result.success) {
      const message = result.error.message;
      setServerError(message);
      showToastWithDescription.error({
        title: "Verification failed",
        description: message,
      });
      return;
    }

    // Mark user as verified in the store so banners/guards update instantly
    updateUser({ isEmailVerified: true });

    setVerified(true);
    showToastWithDescription.success({
      title: "Email verified",
      description:
        result.message || "Your DesiStorage workspace is ready.",
    });
  }

  async function resendCode() {
    setCooldown(30);
    setDigits(Array(LENGTH).fill(""));
    const result = await sendOtpToEmailApi();
    if (!result.success) {
      showToastWithDescription.error({
        title: "Failed To Send OTP",
        description: result.error.message,
      });
      return;
    }
    showToastWithDescription.success({
      title: "Code resent",
      description:
        result.message || `A new code is on its way to ${target}.`,
    });
    inputs.current[0]?.focus();
  }

  if (verified) {
    return (
      <AuthLayout
        eyebrow="All set"
        title="Email verified"
        subtitle={`${target} is now confirmed and secured on your account.`}
        footer={
          <p>
            Need help?{" "}
            <Link
              href="/profile"
              className="font-medium text-primary hover:underline"
            >
              Visit support
            </Link>
          </p>
        }
      >
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div className="text-sm">
              <p className="font-medium text-foreground">
                Verification complete
              </p>
              <p className="mt-1 text-muted-foreground">
                Your email is verified. You can now upload, share and manage
                files across your workspace.
              </p>
            </div>
          </div>
          <Button
            className="h-11 w-full rounded-xl shadow-sm"
            onClick={() => router.replace("/dashboard")}
          >
            Go to my workspace
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Verify email"
      title="Enter your 6-digit code"
      subtitle={`We sent a verification code to ${target}. It expires in 10 minutes.`}
      footer={
        <p>
          Wrong address?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Sign up with another email
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="flex justify-between gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={LENGTH}
                aria-label={`Digit ${i + 1}`}
                value={d}
                onChange={(e) => onChange(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                className="h-14 w-full rounded-xl border border-border bg-background text-center text-xl font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25"
              />
            ))}
          </div>

          {isSubmitted && errors.otp && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.otp.message}
            </p>
          )}

          {serverError && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl text-sm shadow-sm"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Verifying…" : "Verify email"}
          </Button>

          <button
            type="button"
            disabled={cooldown > 0}
            onClick={resendCode}
            className="flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </form>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Codes are single-use and expire automatically.
        </p>
      </div>
    </AuthLayout>
  );
}

export default Page;
