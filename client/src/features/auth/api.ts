import type { RegisterSchema } from "./schema/register.schema";
import type { LoginSchema } from "./schema/login.schema";
import type { VerifyEmailSchema } from "./schema/verify-email.schema";
import type { ChangePasswordSchema } from "@/features/profile/schema/changePassoword.schema";
import { apiRequest, type ApiResult } from "@/utils/api";

// ---------------------------------------------------------------------------
// Types (feature-local — imported by store, consumers, and other features)
// ---------------------------------------------------------------------------

/** User object returned by POST /auth/register.
 *  NOTE: register does NOT return `isEmailVerified`. */
export interface RegisteredUser {
  id: string;
  fullName: string;
  email: string;
  avatar: string | null;
  storageLimit: number;
  storageUsed: number;
}

/** User object returned by POST /auth/login.
 *  NOTE: login does NOT return `avatar`. */
export interface LoginUser {
  id: string;
  fullName: string;
  email: string;
  isEmailVerified: boolean;
  storageLimit: number;
  storageUsed: number;
}

/** Full user object returned by GET /auth (the "me" endpoint).
 *  Carries both `avatar` and `isEmailVerified` — this is the canonical
 *  shape stored in the zustand store. */
export interface MeUser {
  id: string;
  email: string;
  fullName: string;
  avatar: string | null;
  storageLimit: number;
  storageUsed: number;
  isEmailVerified: boolean;
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
  apiRequest<LoginUser>("POST", "/auth/login", payload);

/**
 * Fetches the currently authenticated user from an existing session cookie.
 * Returns the full `MeUser` (avatar + isEmailVerified). 401 if no valid session.
 */
const loggedInUserApi = () => apiRequest<MeUser>("GET", "/auth");

/**
 * Destroys the server-side session and clears the `sid` cookie.
 * The caller should clear local auth state (store) and redirect to /login.
 */
const logoutUserApi = () => apiRequest<null>("POST", "/auth/logout");

/**
 * Changes the authenticated user's password.
 * Server rotates all other sessions on success.
 */
const changePasswordApi = (payload: ChangePasswordSchema) =>
  apiRequest<null>("POST", "/auth/change-password", payload);

const sendOtpToEmailApi = () => apiRequest<null>("POST", "/auth/send-email");

/**
 * Verifies the user's email using the 6-digit OTP sent to their inbox.
 * Returns 401 if the OTP is invalid or expired.
 */
const verifyEmailApi = (payload: VerifyEmailSchema) =>
  apiRequest<null>("POST", "/auth/verify-email", payload);

export {
  registerUserApi,
  loginUserApi,
  loggedInUserApi,
  logoutUserApi,
  changePasswordApi,
  sendOtpToEmailApi,
  verifyEmailApi,
};
export type { ApiResult };
