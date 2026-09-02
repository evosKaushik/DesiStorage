/**
 * Shared fixtures + builders for test payloads.
 */

export const VALID_PASSWORD = "StrongPass1!";
export const VALID_PASSWORD_2 = "AnotherPass2!";

export const testUser = {
  fullName: "Rohan Sharma",
  email: "rohan.sharma@example.com",
  password: VALID_PASSWORD,
};

export const registerPayload = (overrides: Partial<typeof testUser> = {}) => ({
  fullName: testUser.fullName,
  email: testUser.email,
  password: testUser.password,
  ...overrides,
});

export const loginPayload = (overrides: Partial<typeof testUser> = {}) => ({
  email: testUser.email,
  password: testUser.password,
  ...overrides,
});

export const validJwtLike = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

/**
 * Simulated Google ID-token payload (the value verifyIdToken would return).
 */
export const googlePayload = {
  sub: "google-sub-001",
  name: "Ananya kumari",
  email: "ananya.google@gmail.com",
  picture: "https://lh3.googleusercontent.com/a/testing-picture",
  email_verified: true,
  aud: "test-client-id.apps.googleusercontent.com",
  iss: "https://accounts.google.com",
};

export const googlePayloadVariants = {
  noSub: { ...googlePayload, sub: "" },
  noEmail: { ...googlePayload, email: "" },
  unicodeName: {
    ...googlePayload,
    sub: "google-sub-002",
    name: "कौशिक राजपूत",
  },
  dottedName: {
    ...googlePayload,
    sub: "google-sub-003",
    name: "G. Ramesh",
  },
  symbolicName: {
    ...googlePayload,
    sub: "google-sub-004",
    name: "🚀 !!!",
  },
  noName: {
    ...googlePayload,
    sub: "google-sub-005",
    name: "",
  },
};

export const emailLikeEmail = "kaushik.rajput@gmail.com";

/**
 * Shape of the value verifyIdToken resolves with: payload fields a Google
 * ID token exposes. All fields are optional here because tests deliberately
 * hand in partial tickets.
 */
export type GoogleTicket = {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
  email_verified?: boolean;
  aud?: string;
  iss?: string;
  [key: string]: unknown;
};