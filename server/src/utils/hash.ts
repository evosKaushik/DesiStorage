import crypto from "node:crypto";
import { ENV } from "../config/env.js";

const generateSecureToken = () => {
  return crypto.randomBytes(32).toString("base64url");
};

const createHmacHash = (value: string, secret: string) => {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
};

const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString("base64url");
};

const hashPasswordResetToken = (token: string) => {
  return crypto
    .createHmac("sha256", ENV.RESET_PASSWORD_SECRET)
    .update(token)
    .digest("hex");
};

const timingSafeEqualString = (a: string, b: string): boolean => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuf, bBuf);
};

/**
 * Builds an opaque reset token with the shape `userID_Hashed.Hash`:
 *  - `userID_Hashed`: base64url(`${userId}.${nonce}`) (nonce adds per-request entropy)
 *  - `Hash`: HMAC-SHA256 of `userID_Hashed` signed with the reset secret
 * The outer token is base64url-safe (no `+`, `/`, `=`), so it is safe to
 * embed in a URL query string without re-encoding.
 */
const buildPasswordResetToken = (userId: string, nonce: string): string => {
  const userIdHashed = Buffer.from(`${userId}.${nonce}`).toString("base64url");
  const hash = createHmacHash(userIdHashed, ENV.RESET_PASSWORD_SECRET);

  return `${userIdHashed}.${hash}`;
};

/**
 * Verifies the HMAC signature of a reset token and extracts its payload.
 * Throws on malformed or tampered tokens. The returned `userId` and `random`
 * are later bound against the one-time store.
 */
const parsePasswordResetToken = (
  token: string,
): { userId: string; random: string } => {
  const [userIdHashed, hash] = token.split(".");

  if (!userIdHashed || !hash) {
    throw new Error("Malformed reset token");
  }

  const expectedHash = createHmacHash(userIdHashed, ENV.RESET_PASSWORD_SECRET);

  if (!timingSafeEqualString(hash, expectedHash)) {
    throw new Error("Reset token signature mismatch");
  }

  const decoded = Buffer.from(userIdHashed, "base64url").toString("utf8");

  const [userId, random] = decoded.split(".");

  if (!userId || !random) {
    throw new Error("Reset token payload malformed");
  }

  return { userId, random };
};

export {
  generateSecureToken,
  createHmacHash,
  generatePasswordResetToken,
  hashPasswordResetToken,
  buildPasswordResetToken,
  parsePasswordResetToken,
};

