import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { LoggedInUser } from "@/features/auth/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserState {
  user: LoggedInUser | null;

  /**
   * `true` after the initial session check completes (success or failure).
   * While `false`, auth guards should show a loading state rather than
   * redirecting — the app hasn't yet determined whether the session is valid.
   */
  hydrated: boolean;

  setUser: (user: LoggedInUser) => void;
  setHydrated: () => void;
  clearUser: () => void;
  updateUser: (patch: Partial<LoggedInUser>) => void;
  logout: () => void;
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectUser = (state: UserState) => state.user;
export const selectHydrated = (state: UserState) => state.hydrated;
export const selectIsLoggedIn = (state: UserState) =>
  state.hydrated && state.user !== null;
export const selectUserName = (state: UserState) =>
  state.user?.fullName ?? null;
export const selectUserEmail = (state: UserState) => state.user?.email ?? null;
export const selectIsVerified = (state: UserState) =>
  state.user?.isEmailVerified ?? false;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const useUserStore = create<UserState>()(
  immer((set) => ({
    user: null,
    hydrated: false,

    setUser: (user) =>
      set((draft) => {
        draft.user = user;
      }),

    setHydrated: () =>
      set((draft) => {
        draft.hydrated = true;
      }),

    clearUser: () =>
      set((draft) => {
        draft.user = null;
      }),

    updateUser: (patch) =>
      set((draft) => {
        if (!draft.user) return;
        Object.assign(draft.user, patch);
      }),

    logout: () =>
      set((draft) => {
        draft.user = null;
        draft.hydrated = false;
      }),
  })),
);

export default useUserStore;
