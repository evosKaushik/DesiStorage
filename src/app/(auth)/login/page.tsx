"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import {
  AuthLayout,
  SocialAuthButtons,
} from "@/features/auth/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { loginSchema, LoginSchema } from "@/features/auth/schema/login.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const LoginPage = () => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRemembered, setIsRemembered] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginSchema) => {
    setLoading(true);
    new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 2000);
    }).then(() => {
      setLoading(false);
      //   router.push("/login");
    });
    console.log(data);
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to DesiStorage"
      subtitle="Pick up right where you left off — your files are waiting."
      footer={
        <p>
          New to DesiStorage?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Create a free account
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        <SocialAuthButtons label="Continue with" />

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
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="babudakar@gmail.com"
                {...register("email")}
                className={`h-11 rounded-xl pl-9 ${errors.email && "input-error-state"}`}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
                className={`h-11 rounded-xl pl-9 pr-10 ${errors.password && "input-error-state"}`}
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
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              id="remember"
              defaultChecked
              onClick={() => {
                setIsRemembered((prev) => !prev);
              }}
            />
            <span>Keep me signed in for 30 days</span>
          </label>

          <Button
            type="submit"
            disabled={!isValid || loading}
            className="h-11 w-full rounded-xl text-sm shadow-sm"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground -mb-4">
          Protected by 2FA and device-level session controls.
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
