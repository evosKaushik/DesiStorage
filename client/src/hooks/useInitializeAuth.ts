import { loggedInUserApi } from "@/features/auth/api";
import useUserStore, { selectHydrated } from "@/store/useUserStore";
import { useEffect } from "react";

export function useInitializeAuth() {
  const hydrated = useUserStore(selectHydrated);

  const setUser = useUserStore((s) => s.setUser);
  const setHydrated = useUserStore((s) => s.setHydrated);

  useEffect(() => {
    if (hydrated) return;

    let cancelled = false;

    const checkSession = async () => {
      try {
        const res = await loggedInUserApi();

        if (cancelled) return;

        if (res.success) {
          setUser(res.data);
        }
      } finally {
        if (!cancelled) {
          setHydrated();
        }
      }
    };

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [hydrated, setUser, setHydrated]);
}
