import axios from "axios";
import { axiosInstance } from "./axiosInstance";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of every successful response from the Fastify server. */
interface SuccessEnvelope<T> {
  success: true;
  message: string;
  data: T;
}

/** Error body the Fastify error handler always responds with. */
interface ApiErrorBody {
  success: false;
  message: string;
  errors?: string[];
}

/** Normalized error every consumer can branch on. */
export interface ApiFailure {
  message: string;
  /** HTTP status, when the server actually responded (absent on network errors). */
  status?: number;
}

/**
 * Discriminated result every API call resolves to — never throws.
 * Success carries `data: T`; failure carries `error: ApiFailure`.
 */
export type ApiResult<T> =
  | { success: true; data: T }
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

    // Server always includes a `message` — trust it (e.g. "Email already exists")
    if (data?.message) {
      return { message: data.message, status };
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
    const { data } = await axiosInstance.request<SuccessEnvelope<T>>({
      method,
      url,
      ...(payload !== undefined && { data: payload }),
    });

    return { success: true, data: data.data };
  } catch (error) {
    return { success: false, error: parseApiError(error) };
  }
}
