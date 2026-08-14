"use client";

import { useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  User,
} from "lucide-react";
import {
  AuthLayout,
  SocialAuthButtons,
} from "@/features/auth/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import {
  RegisterSchema,
  registerSchema,
} from "@/features/auth/schema/register.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import PasswordInput from "@/features/auth/components/PasswordValidator";
import VerifyEmail from "@/features/auth/components/VerifyEmail";

const RegisterPage = () => {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: RegisterSchema) => {
    setLoading(true);
    setIsFormSubmitted(true);

    console.log(data);
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
      {!isFormSubmitted ? (
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
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground " />
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="Arjun Mehta"
                  {...register("fullName")}
                  className={`h-11 rounded-xl pl-9  ${errors.fullName && "input-error-state"}`}
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
                  placeholder="you@company.in"
                  {...register("email")}
                  className={`h-11 rounded-xl pl-9  ${errors.email && "input-error-state"}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
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
                  className={`h-11 rounded-xl pl-9  ${errors.password && "input-error-state"}`}
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

              {watch("password") && (
                <PasswordInput
                  password={watch("password")}
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

            <Button
              type="submit"
              disabled={loading || !agree}
              className={`h-11 w-full rounded-xl text-sm shadow-sm`}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating account…" : "Create free account"}
            </Button>
          </form>
        </div>
      ) : (
        <>
          <p className="font-medium text-foreground/80 -mt-6 mb-6">
            Reset link sent to{" "}
            <span className="font-semibold underline text-primary">
              {getValues("email")}
            </span>
            . Enter the 6-digit code from the email to verify your account.
          </p>
          <VerifyEmail email={watch("email")} />
        </>
      )}
    </AuthLayout>
  );
};

export default RegisterPage;
