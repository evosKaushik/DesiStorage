import "../setup/env.js";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getSessionActivityCacheKey,
  getUserOtpCacheKey,
  getUserProfileCacheKey,
  getUserSessionCacheKey,
  passwordResetRedisKey,
} from "../../src/utils/cacheKeys.js";
import { createHmacHash } from "../../src/utils/hash.js";

describe("cacheKeys", () => {
  it("builds scoped key namespaces", () => {
    assert.equal(getUserOtpCacheKey("u1"), "user:u1:otp");
    assert.equal(getUserSessionCacheKey("s1"), "user:s1:session");
    assert.equal(getSessionActivityCacheKey("s1"), "session:s1:lastActive");
    assert.equal(getUserProfileCacheKey("u1"), "user:u1");
  });

  it("passwordResetRedisKey is a deterministic HMAC of the random value", () => {
    const random = "some-random-nonce";
    const expected = `password-reset:${createHmacHash(
      random,
      process.env.RESET_PASSWORD_SECRET!,
    )}`;
    assert.equal(passwordResetRedisKey(random), expected);
    assert.equal(passwordResetRedisKey(random), passwordResetRedisKey(random));
  });

  it("hides the raw random value in the key", () => {
    assert.ok(!passwordResetRedisKey("super-secret-nonce").includes("super-secret-nonce"));
  });
});