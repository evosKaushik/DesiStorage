"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2, Mail, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import Link from "next/link";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordApi } from "@/features/auth/api";
import { showToastWithDescription } from "@/components/ShowToastWithDescription";

const emailSchema = z.object({
  email: z.email("Enter a valid email address"),
});

type EmailSchema = z.infer<typeof emailSchema>;

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  const email = searchParams.get("email");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isValid, isSubmitting },
  } = useForm<EmailSchema>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: email || "",
    },
  });

  const onSubmit = async (data: EmailSchema) => {
    setLoading(true);
    setError(null);
    try {
      const result = await forgotPasswordApi(data);
      if (!result.success) {
        const message =
          result.error.message ||
          "An error occurred while sending the reset link. Please try again.";
        setError(message);
        showToastWithDescription.error({
          title: "Couldn't send reset link",
          description: message,
        });
        return;
      }
      setSent(true);
      showToastWithDescription.success({
        title: "Check your inbox",
        description: result.message,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred while sending the reset link. Please try again.";
      setError(message);
      showToastWithDescription.error({
        title: "Couldn't send reset link",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setLoading(true);
    setError(null);
    const result = await forgotPasswordApi({ email: getValues("email") });
    setLoading(false);
    if (!result.success) {
      const message =
        result.error.message ||
        "An error occurred while sending the reset link. Please try again.";
      setError(message);
      showToastWithDescription.error({
        title: "Couldn't resend reset link",
        description: message,
      });
      return;
    }
    showToastWithDescription.success({
      title: "Reset link sent",
      description: result.message,
    });
  };

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title={sent ? "Check your inbox" : "Forgot your password?"}
      subtitle={
        sent
          ? "We've sent a secure reset link. It expires in 30 minutes."
          : "Enter the email tied to your workspace and we'll send a reset link."
      }
      footer={
        <p>
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/40 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MailCheck className="h-5 w-5" />
            </span>
            <div className="text-sm">
              <p className="font-medium text-foreground">
                Reset link sent to {getValues("email")}
              </p>
              <p className="mt-1 text-muted-foreground">
                Open the email and tap the link to set a new password. The link
                expires in 30 minutes. Didn&apos;t get it? Check spam, or
                resend below.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            variant="outline"
            className="h-11 w-full rounded-xl"
            onClick={() => {
              setSent(false);
              setError(null);
            }}
          >
            Use another email
          </Button>

          <button
            type="button"
            onClick={onResend}
            disabled={loading}
            className="w-full text-center text-xs font-medium text-primary hover:underline disabled:opacity-60"
          >
            {loading ? "Sending…" : "Resend email"}
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.in"
                {...register("email")}
                className={`h-11 rounded-xl pl-9 ${errors.email && "input-error-state"}`}
              />
            </div>
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={!isValid || loading}
          className="h-11 w-full rounded-xl text-sm shadow-sm"
        >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Sending link…" : "Send reset link"}
          </Button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
