# DesiStorage Frontend Refactoring — Implementation Plan

## Project Architecture Convention

The frontend follows a **feature-based folder structure**. This plan preserves and reinforces that convention.

```text
src/
├── features/
│   ├── auth/          (login, register, forgot-password)
│   ├── dashboard/     (drive, sidebar, upload)
│   ├── landing/       (marketing page sections)
│   └── profile/       (user settings, tabs)
├── components/        (genuinely app-wide shared components)
├── hooks/             (genuinely reusable across multiple features)
├── utils/             (genuinely reusable across multiple features)
├── store/             (zustand stores)
└── lib/               (existing cn() utility)
```

Feature-specific code stays local. Shared code is placed in `src/components`, `src/hooks`, or `src/utils` only when genuinely shared. No unnecessary abstractions.

---

## Task 1 — Adaptive Toast Theme

**Problem:** `<ToastContainer />` in root layout.tsx has no theme configuration. Toasts always render with the default look regardless of light/dark mode.

**Constraint:** Cannot import DOM class in layout.tsx; cannot make the whole component tree client-side just for theme detection.

### Plan

Create a minimal `"use client"` boundary around only the ToastContainer:

1. **New file: `src/components/ToastProvider.tsx`** — A `"use client"` component that:
   - Calls `useTheme()` from `next-themes` to read the resolved theme
   - Returns `<ToastContainer theme={resolvedTheme} ... />` with position and auto-close config
   - This is the only client-side hook needed — no DOM access, no effect

2. **Edit `src/app/layout.tsx`:**
   - Replace `<ToastContainer />` with `<ToastProvider />`
   - No other changes. Layout remains a Server Component.

**Result:** Theme detection happens inside one tiny client component. Everything else stays server-rendered. Zero unnecessary client boundaries.

---

## Task 2 — Zustand User Store (Immer + Strict Types)

**Problem:** Current store is bare-bones — no immer for immutable mutations, missing `clearUser`/`updateUser`, `getUser` pattern is unergonomic.

### Plan

1. **Install immer** in `client/`

2. **Rewrite `src/store/useUserStore.ts`:**
   - Import `immer` middleware and wrap the zustand store with `immer()` for mutation-style code
   - Strict TypeScript throughout: no `any`, no type assertions, explicit `UserState` interface
   - Actions: `setUser`, `clearUser`, `updateUser` (partial merge via immer)
   - Remove `getUser` action — consumers use `useUserStore((s) => s.user)` selector instead (standard zustand pattern, avoids calling a method for a read)
   - Export both the hook and a typed selector helper: `export const selectUser = (s: UserState) => s.user`

3. **Update consumers** to use the selector pattern:
   - `ProfilePage.tsx`: replace `getUser()` with `useUserStore(selectUser)` hook
   - `login/page.tsx`: already calls `setUser(result.user)` — no change needed
   - `ProfileMenu.tsx`: currently uses hardcoded user ("Arjun Rathore") — wire to store

---

## Task 3 — Server Components & Performance Audit

### Issues Found

| File | Issue | Severity |
|------|-------|----------|
| `FAQs.tsx` | Renders interactive Accordion but has NO `"use client"` — runtime bug | HIGH |
| `NotificationsPopover.tsx` | Uses `useState`, `Popover` but NO `"use client"` — runtime bug | HIGH |
| `UploadContext.tsx` | Full context provider with `createContext`/`useState`/`useEffect` but NO `"use client"` — runtime bug | HIGH |
| `profile/page.tsx` | Has redundant `"use client"` (ProfilePage already has it) | LOW |
| `DashboardShell.tsx` | 200+ line monolith, mixes sidebar/header/upload/shell — could be split | MEDIUM |
| `ProfilePage.tsx` | Static header + interactive tabs in one client component | MEDIUM |

### What's Already Good (no changes needed)

- **Landing page** (`page.tsx`): Server Component, composes child components
- **Hero, Features, Security, Pricing, Testimonials, CTA**: Already Server Components (pure static JSX)
- **Demo.tsx**: Heavily interactive — must stay Client Component
- **Dashboard page**: Deeply interactive — must stay Client Component
- **Auth pages** (login, register, forgot-password): Forms with hooks — must stay Client Components
- **SiteNav.tsx**: Scroll detection + mobile menu — must stay Client Component

### Execution

**3a. Fix missing `"use client"` directives (bugs):**

1. `UploadContext.tsx` — add `"use client"` at top
2. `NotificationsPopover.tsx` — add `"use client"` at top

**3b. Fix `FAQs.tsx` (missing directive on interactive component):**
- Extract `<Accordion>` usage into a new `"use client"` component `FAQAccordion` inside `features/landing/components/`
- Keep `FAQs.tsx` as a server component that renders heading + `<FAQAccordion items={FAQS} />`

**3c. Remove redundant directive:**
- `profile/page.tsx` — remove `"use client"`, just import and render `<ProfilePage />`

**3d. Split `DashboardShell.tsx` into focused components:**

Current 200+ line monolith splits into:
- `DashboardSidebar.tsx` — owns `collapsed` state, `usePathname`, `useSearchParams`, nav items, upload button
- `DashboardHeader.tsx` — owns search state, `useDashboardSearch`, renders ThemeToggle/Notifications/ProfileMenu
- `DashboardShell.tsx` — thin client shell that composes Sidebar + Header + children + UploadPanel, provides UploadProvider and SearchProvider

**3e. Split `ProfilePage.tsx`:**
- `ProfileHeader.tsx` — avatar, name, badges, "Back to Drive" link (reads user from store)
- `ProfileTabs.tsx` — the `<Tabs>` block with all 6 tab contents
- `ProfilePage.tsx` — thin wrapper composing ProfileHeader + ProfileTabs

---

## Task 4 — API Error Handling & Reusable API Layer

**Problem:** `getApiErrorMessage` is defined in `auth/api.ts` but will be needed by all feature API files. Every API function manually does try/catch with the same axios response parsing. The `ApiResult` type is auth-specific (`{ user }`) but the pattern is universal.

### Plan

**4a. Shared API utilities (`src/utils/api.ts`):**

Create a generic, feature-agnostic API utility module:

```typescript
// Types
interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}
interface ApiErrorBody {
  success: false;
  message: string;
  errors?: string[];
}
interface ApiFailure {
  message: string;
  status?: number;
}
type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiFailure };

// Functions
function parseApiError(error: unknown): ApiFailure { ... }

async function apiRequest<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  payload?: unknown,
): Promise<ApiResult<T>> { ... }
```

This eliminates all try/catch duplication across feature API files.

**4b. Refactor `features/auth/api.ts`:**
- Remove `getApiErrorMessage` (now in `src/utils/api.ts`)
- Import `apiRequest` and `ApiResult` from `@/utils/api`
- Re-export `LoggedInUser` and `RegisteredUser` types (these stay auth-local)
- Simplify each API function to a single `apiRequest` call

**4c. Update consumers:**
- Login page, register page, ProfilePage: use `result.data` instead of `result.user`

---

## Task 5 — Reusable Hooks

**Principle:** Only create hooks that provide real value across multiple features or eliminate meaningful duplication.

### Plan

**5a. `src/hooks/useCurrentUser.ts`** — Shared across features:
- On mount, if zustand store is empty, fetches current user via `loggedInUserApi()`
- Returns `{ user, isLoading }` 
- Used by: ProfilePage, ProfileMenu, DashboardShell header, any future authenticated component

No other hooks are justified given the current codebase.

---

## Task 6 — Reusable Components

**No new shared components are needed.** Current `src/components/ui/` (shadcn) + Logo + ThemeToggle + RouteProgress cover all app-wide needs.

**Feature-specific components to create:**
1. `features/landing/components/FAQAccordion.tsx` — extracted interactive accordion (Task 3b)
2. `features/dashboard/components/DashboardSidebar.tsx` — extracted from DashboardShell (Task 3d)
3. `features/dashboard/components/DashboardHeader.tsx` — extracted from DashboardShell (Task 3d)
4. `features/profile/components/ProfileHeader.tsx` — extracted static header (Task 3e)
5. `features/profile/components/ProfileTabs.tsx` — extracted interactive tabs (Task 3e)

---

## Task 7 — Utilities

**Create `src/utils/api.ts`** — described in Task 4a. This is the only new global utility file.

No other global utilities are needed. `src/lib/utils.ts` has `cn()`. Feature-local utils stay local.

---

## Execution Order

| Phase | Task | Files Changed | Risk |
|-------|------|---------------|------|
| **1** | Install immer | `client/package.json` | None |
| **2** | Shared API layer (Task 4a) | `utils/api.ts` (new) | None — new file |
| **3** | Adaptive Toast (Task 1) | `ToastProvider.tsx` (new), `layout.tsx` | Low |
| **4** | Auth API refactor (Task 4b) | `features/auth/api.ts` | Medium — changes API shapes |
| **5** | Store refactor (Task 2) | `store/useUserStore.ts` | Medium — changes store API |
| **6** | Update all consumers | `login/page.tsx`, `register/page.tsx`, `ProfilePage.tsx`, `ProfileMenu.tsx` | Medium — fix imports |
| **7** | Fix `"use client"` bugs (Task 3a) | `UploadContext.tsx`, `NotificationsPopover.tsx` | Low |
| **8** | Fix FAQs (Task 3b) | `FAQs.tsx`, `FAQAccordion.tsx` (new) | Low |
| **9** | Remove redundant directive | `profile/page.tsx` | None |
| **10** | Split DashboardShell (Task 3d) | `DashboardShell.tsx`, `DashboardSidebar.tsx` (new), `DashboardHeader.tsx` (new) | Medium |
| **11** | Split ProfilePage (Task 3e) | `ProfilePage.tsx`, `ProfileHeader.tsx` (new), `ProfileTabs.tsx` (new) | Medium |
| **12** | useCurrentUser hook (Task 5a) | `hooks/useCurrentUser.ts` (new), consumers | Low |
| **13** | Lint + Typecheck + Verify | — | — |

Phases 2-6 ordered to maintain type safety throughout (new utilities first, then refactor consumers).

---

## Files Summary

### New files
| File | Purpose |
|------|---------|
| `src/components/ToastProvider.tsx` | Adaptive toast theme (Task 1) |
| `src/utils/api.ts` | Shared API client, types, error parsing (Task 4a) |
| `src/hooks/useCurrentUser.ts` | Session user hydration hook (Task 5a) |
| `src/features/landing/components/FAQAccordion.tsx` | Extracted interactive accordion (Task 3b) |
| `src/features/dashboard/components/DashboardSidebar.tsx` | Extracted sidebar (Task 3d) |
| `src/features/dashboard/components/DashboardHeader.tsx` | Extracted header (Task 3d) |
| `src/features/profile/components/ProfileHeader.tsx` | Extracted static header (Task 3e) |
| `src/features/profile/components/ProfileTabs.tsx` | Extracted interactive tabs (Task 3e) |

### Modified files
| File | Change |
|------|--------|
| `client/package.json` | +immer dependency |
| `src/app/layout.tsx` | `<ToastContainer>` → `<ToastProvider>` |
| `src/store/useUserStore.ts` | Immer + strict types + selectors |
| `src/features/auth/api.ts` | Use shared `apiRequest` |
| `src/app/(auth)/login/page.tsx` | Use store selector, update API result shape |
| `src/app/(auth)/register/page.tsx` | Update API result shape |
| `src/features/profile/components/ProfilePage.tsx` | Compose ProfileHeader + ProfileTabs |
| `src/features/dashboard/components/DashboardShell.tsx` | Compose DashboardSidebar + DashboardHeader |
| `src/features/dashboard/components/ProfileMenu.tsx` | Wire to user store |
| `src/features/landing/components/FAQs.tsx` | Use extracted FAQAccordion |
| `src/features/dashboard/components/UploadContext.tsx` | Add `"use client"` |
| `src/features/dashboard/components/NotificationsPopover.tsx` | Add `"use client"` |
| `src/app/(dashboard)/profile/page.tsx` | Remove redundant `"use client"` |

---

## Constraints

- **No server/backend code changes** — frontend only.
- **No unnecessary `"use client"` additions** — every client boundary is justified.
- **No barrel exports** — direct imports per project convention.
- **No type assertions or `any`** — strict TypeScript throughout.
- **Feature-specific code stays in its feature directory.**
- **Goal:** Performant, strongly typed, maintainable architecture consistent with feature-based structure.
