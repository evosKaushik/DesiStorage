"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Field } from "../Field";
import { SectionCard } from "../SectionCard";
import {
  changePasswordSchema,
  type ChangePasswordSchema,
} from "../../schema/changePassoword.schema";
import { changePasswordApi } from "@/features/auth/api";

export function SecurityTab() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ChangePasswordSchema) {
    setServerError(null);

    const result = await changePasswordApi(data);

    if (!result.success) {
      setServerError(result.error.message);
      return;
    }

    toast.success("Password changed successfully");
    reset();
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Password" description="Last changed 3 months ago.">
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <Field
            label="Current"
            type="password"
            autoComplete="current-password"
            error={errors.oldPassword?.message}
            {...register("oldPassword")}
          />
          <Field
            label="New"
            type="password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
          <Field
            label="Confirm"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          {serverError && (
            <div className="sm:col-span-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="sm:col-span-3 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Two-factor authentication"
        description="Add an extra layer of security using an authenticator app."
      >
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium">Authenticator app</div>
            <div className="text-muted-foreground">
              Enabled · configured 2 months ago
            </div>
          </div>
          <Switch defaultChecked />
        </div>
      </SectionCard>

      <SectionCard
        title="Danger zone"
        description="Irreversible account actions."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Permanently delete your account and all data.
          </div>
          <AlertDialog>
            <AlertDialogTrigger className={buttonVariants({ variant: "destructive" })}>
              Delete account
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove your workspace, files and
                  sharing links. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SectionCard>
    </div>
  );
}
