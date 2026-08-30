"use client";

import { useEffect } from "react";
import useUserStore, { selectUser, selectHydrated, selectIsLoggedIn } from "@/store/useUserStore";
import { loggedInUserApi } from "@/features/auth/api";

export function useCurrentUser() {
  const user = useUserStore(selectUser);
  const hydrated = useUserStore(selectHydrated);
  const isLoggedIn = useUserStore(selectIsLoggedIn);

  const setUser = useUserStore((s) => s.setUser);
  const setHydrated = useUserStore((s) => s.setHydrated);

  useEffect(() => {
    if (hydrated) return;

    let cancelled = false;

    loggedInUserApi().then((res) => {
      if (cancelled) return;

      if (res.success) {
        setUser(res.data);
      }

      setHydrated();
    });

    return () => {
      cancelled = true;
    };
  }, [hydrated, setUser, setHydrated]);

  return {
    user,
    hydrated,
    isLoggedIn,
  };
}
