import axios from "axios";
import { axiosInstance } from "./axiosInstance";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Envelope returned by the Fastify server on every response.
 * - `success: true` responses come from `reply.success(status, message, data)`
 *   where `data` may be `null` (e.g. logout, change-password) or a payload object.
 * - `success: false` responses come from the error handler (see below).
 *
 * Every endpoint is wrapped in this envelope.
 */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

/** Error body produced by the Fastify error handler. */
export interface ApiErrorBody {
  success: false;
  message: string;
  /** Present only on Zod validation failures (HTTP 400). */
  errors?: string[];
}

/** Normalized error every consumer can branch on. */
export interface ApiFailure {
  message: string;
  /** HTTP status, when the server actually responded (absent on network errors). */
  status?: number;
  /** Validation field errors, when the server returned them. */
  errors?: string[];
}

/**
 * Discriminated result every API call resolves to — never throws.
 * - Success carries `data: T` plus the server `message` (e.g. the success
 *   message to show when the payload is `null`, like "Password changed").
 * - Failure carries `error: ApiFailure`.
 */
export type ApiResult<T> =
  | { success: true; data: T; message: string }
  | { success: false; error: ApiFailure };

// ---------------------------------------------------------------------------
// Error normalization
// ---------------------------------------------------------------------------

/** Maps any thrown value into a user-facing `ApiFailure`. */
export function parseApiError(error: unknown): ApiFailure {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    // Request sent but no response received → offline / server down / CORS
    if (!error.response) {
      return {
        message:
          "Cannot reach the server. Check your connection and try again.",
      };
    }

    const { status, data } = error.response;

    // The server error handler always responds `{ success:false, message }`.
    // Trust its message (e.g. "Email already exists", "Invalid current password").
    if (data && typeof data === "object" && "success" in data) {
      const body = data as ApiErrorBody;
      return {
        message: body.message || "Something went wrong. Please try again.",
        status,
        ...(body.errors?.length ? { errors: body.errors } : {}),
      };
    }

    if (status >= 500) {
      return { message: "Server error. Please try again later.", status };
    }

    return { message: "Something went wrong. Please try again.", status };
  }

  return { message: "Something went wrong. Please try again." };
}

// ---------------------------------------------------------------------------
// Generic request helper
// ---------------------------------------------------------------------------

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * Wraps `axiosInstance` with consistent typing and error normalization.
 * All feature API functions should delegate to this instead of duplicating
 * try/catch + axios logic.
 *
 * @example
 * const result = await apiRequest<User[]>("GET", "/users");
 * if (result.success) {
 *   result.data.forEach(u => console.log(u.name));
 * }
 */
export async function apiRequest<T>(
  method: HttpMethod,
  url: string,
  payload?: unknown,
): Promise<ApiResult<T>> {
  try {
    const { data, status } = await axiosInstance.request<ApiEnvelope<T>>({
      method,
      url,
      ...(payload !== undefined && { data: payload }),
    });

    // Guard: a 2xx body may still carry `success:false` (contract drift).
    // Normalize it into a failure instead of blindly trusting `data`.
    if (!data || data.success === false) {
      const failed = data as ApiErrorBody | undefined;
      return {
        success: false,
        error: {
          message:
            failed?.message ?? "Something went wrong. Please try again.",
          status,
          ...(failed?.errors?.length ? { errors: failed.errors } : {}),
        },
      };
    }

    return { success: true, data: data.data as T, message: data.message };
  } catch (error) {
    return { success: false, error: parseApiError(error) };
  }
}
