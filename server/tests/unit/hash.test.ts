import "../setup/env.js";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildPasswordResetToken,
  createHmacHash,
  generatePasswordResetToken,
  generateSecureToken,
  parsePasswordResetToken,
} from "../../src/utils/hash.js";

describe("hash utils", () => {
  describe("generateSecureToken / generatePasswordResetToken", () => {
    it("returns a base64url string (no +, /, =)", () => {
      for (const token of [generateSecureToken(), generatePasswordResetToken()]) {
        assert.match(token, /^[A-Za-z0-9_-]+$/);
        assert.ok(token.length >= 32);
      }
    });

    it("produces unique tokens", () => {
      const tokens = new Set(
        Array.from({ length: 100 }, () => generateSecureToken()),
      );
      assert.equal(tokens.size, 100);
    });
  });

  describe("createHmacHash", () => {
    it("is deterministic for equal input+secret", () => {
      assert.equal(
        createHmacHash("abc", "secret"),
        createHmacHash("abc", "secret"),
      );
    });

    it("differs when the secret changes", () => {
      assert.notEqual(
        createHmacHash("abc", "secret-a"),
        createHmacHash("abc", "secret-b"),
      );
    });
  });

  describe("buildPasswordResetToken / parsePasswordResetToken", () => {
    const userId = "64193b9a1c3a2b0a1c8e4567";
    const nonce = "abc123-nonce";

    it("round-trips a valid token", () => {
      const token = buildPasswordResetToken(userId, nonce);
      assert.deepEqual(parsePasswordResetToken(token), { userId, random: nonce });
    });

    it("produces a URL-safe token with two dot-separated segments", () => {
      const token = buildPasswordResetToken(userId, nonce);
      assert.match(token, /^[A-Za-z0-9_-]+\.[A-Fa-f0-9]{64}$/);
    });

    it("throws on a token with a tampered signature", () => {
      const token = buildPasswordResetToken(userId, nonce);
      const payload = token.split(".")[0]!;
      const flipped = payload.slice(0, -1) + (payload.endsWith("A") ? "B" : "A");
      assert.throws(() => parsePasswordResetToken(`${flipped}.${"0".repeat(64)}`));
    });

    it("throws on malformed tokens", () => {
      assert.throws(() => parsePasswordResetToken("missing-signature"));
      assert.throws(() => parsePasswordResetToken(""));
      assert.throws(() => parsePasswordResetToken("a.b.c.d"));
    });

    it("throws when the encoded payload has no userId/random", () => {
      const token = buildPasswordResetToken(userId, nonce);
      const [payload, hash] = token.split(".");
      const emptyPayload = Buffer.from("").toString("base64url");
      // Rebuild with an empty payload but a *valid* signature for that payload.
      const emptyHash = createHmacHash(emptyPayload, process.env.RESET_PASSWORD_SECRET!);
      assert.throws(() => parsePasswordResetToken(`${emptyPayload}.${emptyHash}`));
      void hash;
    });
  });
});