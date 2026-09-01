"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useGoogleAuthentication } from "@/hooks/useGoogleAuthentication";

export function SocialAuthButtons() {
  const { onSuccess, onError } = useGoogleAuthentication();

  return (
    <div className="w-full flex justify-center">
      <div className="shadow-md shadow-accent-foreground/50 rounded-full">
        <div className="rounded-full overflow-hidden">
          <GoogleLogin
            onSuccess={onSuccess}
            onError={onError}
            theme="outline"
            size="large"
            text="continue_with"
            shape="pill"
            width="240"
            ux_mode="popup"
            useOneTap
          />
        </div>
      </div>
    </div>
  );
}