"use client";

import { useState } from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import {
  AuthLayout,
  SocialAuthButtons,
} from "@/features/auth/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useForm } from "react-hook-form";
import {
  RegisterSchema,
  registerSchema,
} from "@/features/auth/schema/register.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import PasswordInput from "@/features/auth/components/PasswordValidator";
import { registerUserApi } from "@/features/auth/api";
import { cn } from "@/lib/utils";

const RegisterPage = () => {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (data: RegisterSchema) => {
    // Clear any previous server-side error before retrying
    setServerError(null);

    const result = await registerUserApi(data);

    if (!result.success) {
      const { message, status } = result.error;

      // Duplicate email -> point the user at the exact field
      if (status === 409) {
        setError("email", { message });
        return;
      }

      // Network / validation / unexpected errors -> inline banner below
      // (kept next to the form instead of a toast so it stays visible)
      setServerError(message);
      return;
    }

    // Account created. Like most apps, email is verified later —
    // send the user to sign in instead of showing an OTP screen here.
    // TODO(UI): build a /verify-email screen reachable after login.
    toast.success("Account created! Please sign in to continue.");
    router.push("/login");
  };

  return (
    <AuthLayout
      eyebrow="Free forever · 15GB included"
      title="Create your DesiStorage account"
      subtitle="Set up your encrypted workspace in under a minute. No card required."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in instead
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        <SocialAuthButtons label="Sign up with" />

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            or
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                autoComplete="name"
                placeholder="Babu Dakar"
                {...register("fullName")}
                className={cn(
                  "h-11 rounded-xl pl-9",
                  errors.fullName && "input-error-state",
                )}
              />
            </div>
            {errors.fullName && (
              <p className="text-sm text-destructive">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="babudakar@gmail.com"
                {...register("email")}
                className={cn(
                  "h-11 rounded-xl pl-9",
                  errors.email && "input-error-state",
                )}
              />
            </div>
            {/* Shows both client validation and server 409 ("Email already exists") */}
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a strong password"
                {...register("password")}
                className={cn(
                  "h-11 rounded-xl pl-9 pr-10",
                  errors.password && "input-error-state",
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

            {password && (
              <PasswordInput
                password={password}
                isShowErrors={!!errors.password}
              />
            )}
          </div>

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <Checkbox
              id="terms"
              checked={agree}
              onCheckedChange={(v) => setAgree(v === true)}
              className="mt-0.5"
            />
            <span>
              I agree to the{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>

          {/* Inline banner for form-level errors; toasts are reserved for
              success moments (see onSubmit) to keep feedback minimal. */}
          {serverError && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || !agree}
            className="h-11 w-full rounded-xl text-sm shadow-sm"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Creating account…" : "Create free account"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;
