import type { TestContext } from "node:test";
import { googleOAuthClient } from "../../src/utils/googleAuth.js";
import type { GoogleTicket } from "./fixtures.js";

type Behavior =
  | { mode: "payload"; payload: GoogleTicket }
  | { mode: "throw"; error: Error };

let behavior: Behavior = { mode: "payload", payload: {} };

export function setGooglePayload(payload: GoogleTicket): void {
  behavior = { mode: "payload", payload };
}

export function resetGoogleMock(): void {
  behavior = { mode: "payload", payload: {} };
}

/** Make client.verifyIdToken reject (as it does for a bad/expired ticket). */
export function failVerifyIdToken(): void {
  behavior = { mode: "throw", error: new Error("verify failed") };
}

/**
 * Installs the verifyIdToken mock for a test. googleOAuthClient is a plain
 * object instance, so its protoype methods are re-mockable per test — unlike
 * ESM module namespaces, which node:test cannot redefine.
 */
export const mockGoogleClient = (t: TestContext): void => {
  t.mock.method(googleOAuthClient, "verifyIdToken", async () => {
    const current = behavior;

    if (current.mode === "throw") throw current.error;

    return { getPayload: () => current.payload };
  });
};