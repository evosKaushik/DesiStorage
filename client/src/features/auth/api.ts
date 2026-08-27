import type { RegisterSchema } from "./schema/register.schema";
import type { LoginSchema } from "./schema/login.schema";
import type { ChangePasswordSchema } from "@/features/profile/schema/changePassoword.schema";
import { apiRequest, type ApiResult } from "@/utils/api";

// ---------------------------------------------------------------------------
// Types (feature-local — imported by store, consumers, and other features)
// ---------------------------------------------------------------------------

/** User object returned by POST /auth/register */
export interface RegisteredUser {
  id: string;
  fullName: string;
  email: string;
  avatar: string | null;
  storageLimit: number;
  storageUsed: number;
}

/** User object returned by POST /auth/login (session cookie via Set-Cookie) */
export interface LoggedInUser {
  id: string;
  fullName: string;
  email: string;
  isEmailVerified: boolean;
  storageLimit: number;
  storageUsed: number;
}

// ---------------------------------------------------------------------------
// API functions — delegate to shared apiRequest helper
// ---------------------------------------------------------------------------

/**
 * Registers a new user. On success the caller should redirect to /login.
 */
const registerUserApi = (payload: RegisterSchema) =>
  apiRequest<RegisteredUser>("POST", "/auth/register", payload);

/**
 * Logs a user in. The server replies with an httpOnly session cookie (`sid`)
 * which axios stores automatically (`withCredentials: true`).
 */
const loginUserApi = (payload: LoginSchema) =>
  apiRequest<LoggedInUser>("POST", "/auth/login", payload);

/**
 * Fetches the currently authenticated user from an existing session cookie.
 * Returns 401 if no valid session exists.
 */
const loggedInUserApi = () =>
  apiRequest<LoggedInUser>("GET", "/auth");

/**
 * Destroys the server-side session and clears the `sid` cookie.
 * The caller should clear local auth state (store) and redirect to /login.
 */
const logoutUserApi = () =>
  apiRequest<null>("POST", "/auth/logout");

/**
 * Changes the authenticated user's password.
 * Server rotates all other sessions on success.
 */
const changePasswordApi = (payload: ChangePasswordSchema) =>
  apiRequest<null>("POST", "/auth/change-password", payload);

export {
  registerUserApi,
  loginUserApi,
  loggedInUserApi,
  logoutUserApi,
  changePasswordApi,
};
export type { ApiResult };
