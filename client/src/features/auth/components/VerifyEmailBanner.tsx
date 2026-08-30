"use client";

import { Button } from "@/components/ui/button";
import useUserStore, { selectIsVerified } from "@/store/useUserStore";
import { TriangleAlertIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { sendOtpToEmailApi } from "../api";
import { useRouter } from "next/navigation";
import { showToastWithDescription } from "@/utils/toast";

const VerifyEmailBanner = () => {
  const router = useRouter();
  const isUserEmailVerified = useUserStore(selectIsVerified);

  if (isUserEmailVerified) return null;

  return (
    <div
      role="alert"
      className="
      mb-2
        relative overflow-hidden
        flex flex-col gap-4
        rounded-xl
        border border-amber-500/20
        bg-amber-500/[0.06]
        px-4 py-3.5
        shadow-sm
        sm:flex-row sm:items-center sm:justify-between
        dark:border-amber-400/20
        dark:bg-amber-400/[0.06]
      "
    >
      {/* Subtle accent glow */}
      <div
        className="
          absolute left-0 top-0 h-full w-2
          bg-amber-500
          dark:bg-amber-400
        "
      />

      <div className=" xs:flex min-w-0 items-start gap-3">
        {/* Icon */}
        <div className="flex items-center gap-4">
          <div
            className="
          flex size-9 shrink-0 items-center justify-center
          rounded-lg
          bg-amber-500/10
          text-amber-600
          dark:bg-amber-400/10
          dark:text-amber-400
          "
          >
            <TriangleAlertIcon className="size-5" />
          </div>
          <h2 className="xs:hidden text-sm font-semibold text-foreground">
            Email verification required
          </h2>
        </div>
        <p className="xs:hidden text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Verify your email to keep your account secure and access all features
          without interruption.
        </p>

        {/* Content */}
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="hidden xs:block text-sm font-semibold text-foreground">
              Email verification required
            </h2>

            <span
              className="
                hidden rounded-full
                bg-amber-500/10
                px-2 py-0.5
                text-[10px] font-medium
                text-amber-700
                sm:inline-flex
                dark:bg-amber-400/10
                dark:text-amber-400
              "
            >
              Action required
            </span>
          </div>

          <p className="hidden xs:block text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Verify your email to keep your account secure and access all
            features without interruption.
          </p>

          <Link
            href="/terms-condition"
            className="
              inline-block
              text-xs font-medium
              text-muted-foreground
              underline underline-offset-2
              transition-colors
              hover:text-foreground
            "
          >
            View Terms & Conditions
          </Link>
        </div>
      </div>

      {/* CTA */}

      <Button
        onClick={async () => {
          const result = await sendOtpToEmailApi();
          if (!result.success) {
            showToastWithDescription.error({
              title: "Failed To Send OTP",
              description: result.error.message,
            });
            return;
          }

          showToastWithDescription.success({
            title: "OTP Sent",
            description:
              result.message || "Check your email for the verification code.",
          });

          router.replace("/verify-email");
        }}
        size="sm"
        className="
        shrink-0
        gap-1.5
        bg-amber-500
        text-white
        shadow-sm
        hover:bg-amber-600
        dark:bg-amber-400
        dark:text-amber-950
        dark:hover:bg-amber-300
        "
      >
        Verify Email
        <ArrowRightIcon className="size-3.5" />
      </Button>
    </div>
  );
};

export default VerifyEmailBanner;
