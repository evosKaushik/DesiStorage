"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import type { CredentialResponse } from "@react-oauth/google";
import { googleAuthenticationApi } from "@/features/auth/api";
import { showToastWithDescription } from "@/components/ShowToastWithDescription";
import useUserStore from "@/store/useUserStore";
import { ENV } from "@/lib/env";

/**
 * Reusable Google OAuth handlers. Works with both the popup <GoogleLogin>
 * button and the useGoogleOneTapLogin hook — they share the same
 * CredentialResponse shape.
 *
 * On success it validates the idToken, calls POST /auth/google, hydrates the
 * user store and routes the user to the dashboard.
 */
export function useGoogleAuthentication() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);

  const onSuccess = useCallback(
    async (credentialResponse: CredentialResponse) => {
      console.log(credentialResponse)
      let { credential, clientId } = credentialResponse;

      clientId = clientId ?? ENV.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      if (!credential || !clientId) {
        showToastWithDescription.error({
          title: "Google login failed",
          description:
            "Missing idToken or clientId from Google login response",
        });
        return;
      }

      try {
        const result = await googleAuthenticationApi({
          idToken: credential,
          clientId,
        });

        if (!result.success) {
          showToastWithDescription.error({
            title: "Google login failed",
            description: result.error.message || "Unknown error",
          });
          return;
        }

        setUser(result.data);
        toast.success(`Welcome back, ${result.data.fullName.split(" ")[0]}!`);
        router.replace("/dashboard");
      } catch {
        showToastWithDescription.error({
          title: "Google login failed",
          description:
            "An error occurred while processing the Google login request",
        });
      }
    },
    [router, setUser],
  );

  const onError = useCallback(() => {
    console.log("Login Failed");
  }, []);

  return { onSuccess, onError };
}