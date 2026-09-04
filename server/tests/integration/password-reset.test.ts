import "../setup/env.js";

import { after, before, beforeEach, describe, it, type SuiteContext, type TestContext } from "node:test";
import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";
import User from "../../src/models/user.model.js";
import { createTestApp } from "../helpers/app.js";
import { loginUser, registerUser } from "../helpers/auth.js";
import { connectTestDb, closeTestDb, resetTestDb } from "../setup/db.js";
import { fakeRedis, mockRedis, resetRedis } from "../setup/redis.js";
import { emailCalls, mockSendEmail, resetEmailCalls } from "../setup/email.js";
import { buildPasswordResetToken, generatePasswordResetToken } from "../../src/utils/hash.js";
import { passwordResetRedisKey } from "../../src/utils/cacheKeys.js";
import { registerPayload, testUser } from "../setup/fixtures.js";

const AUTH = "/api/v1/auth";

let app: FastifyInstance;

before(async () => {
  await connectTestDb();
  app = await createTestApp();
});

beforeEach(async (t: TestContext | SuiteContext) => {
  await resetTestDb();
  resetRedis();
  mockRedis(t as TestContext);
  mockSendEmail(t as TestContext);
  resetEmailCalls();
});

after(async () => {
  await app.close();
  await closeTestDb();
});

const seedResetToken = async (userId: string): Promise<string> => {
  const random = generatePasswordResetToken();

  await fakeRedis.set(passwordResetRedisKey(random), userId, { EX: 600 });

  return buildPasswordResetToken(userId, random);
};

const extractTokenFromEmail = (html: string): string => {
  const match = html.match(/reset-password\?token=([A-Za-z0-9_.-]+)/);

  assert.ok(match, "reset link should be in the email");
  return match![1]!;
};

describe("forgot-password", () => {
  it("sends a reset email for an existing account and seeds redis", async () => {
    await registerUser(app, registerPayload());

    const res = await app.inject({
      method: "POST",
      url: `${AUTH}/forgot-password/${encodeURIComponent(testUser.email)}`,
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().message, "If an account exists, a password reset link has been sent to your email.");

    assert.equal(emailCalls().length, 1);

    const token = extractTokenFromEmail(emailCalls()[0]!.html);
    assert.ok(token.length >= 20);

    const user = await User.findOne({ email: testUser.email }).lean();
    assert.ok(user);
    assert.equal(await fakeRedis.get(`password-reset:cooldown:${user!._id}`), "1");
  });

  it("does not reveal whether the account exists", async () => {
    const res = await app.inject({
      method: "POST",
      url: `${AUTH}/forgot-password/ghost@example.com`,
    });

    assert.equal(res.statusCode, 200);
    assert.equal(emailCalls().length, 0);
  });

  it("rate-limits repeated requests with 429", async () => {
    await registerUser(app, registerPayload());

    await app.inject({
      method: "POST",
      url: `${AUTH}/forgot-password/${encodeURIComponent(testUser.email)}`,
    });
    const res = await app.inject({
      method: "POST",
      url: `${AUTH}/forgot-password/${encodeURIComponent(testUser.email)}`,
    });

    assert.equal(res.statusCode, 429);
    assert.match(res.json().message, /already been sent/);
  });

  it("validates the email param", async () => {
    const res = await app.inject({
      method: "POST",
      url: `${AUTH}/forgot-password/not-an-email`,
    });

    assert.equal(res.statusCode, 400);
    assert.ok(Array.isArray(res.json().errors));
  });
});

describe("verify-reset-token", () => {
  it("accepts a valid, seeded token", async () => {
    const user = await User.create({
      fullName: testUser.fullName,
      email: testUser.email,
      password: testUser.password,
      authProviders: ["local"],
    });
    const token = await seedResetToken(user._id.toString());

    const res = await app.inject({
      method: "GET",
      url: `${AUTH}/verify-reset-token?token=${encodeURIComponent(token)}`,
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().message, "Password reset token is valid.");
  });

  it("does not consume the token on verify and rejects a tampered token", async () => {
    const user = await User.create({
      fullName: testUser.fullName,
      email: testUser.email,
      password: testUser.password,
      authProviders: ["local"],
    });
    const token = await seedResetToken(user._id.toString());

    // Verification is a read-only pre-check — it must NOT consume the token,
    // otherwise the subsequent reset-password step (which owns consumption)
    // would fail with "Invalid or expired password reset link."
    const verify = await app.inject({
      method: "GET",
      url: `${AUTH}/verify-reset-token?token=${encodeURIComponent(token)}`,
    });
    assert.equal(verify.statusCode, 200);

    const again = await app.inject({
      method: "GET",
      url: `${AUTH}/verify-reset-token?token=${encodeURIComponent(token)}`,
    });
    assert.equal(again.statusCode, 200, "verify must be repeatable");

    const [payload] = token.split(".");
    const tampered = await app.inject({
      method: "GET",
      url: `${AUTH}/verify-reset-token?token=${encodeURIComponent(
        `${payload}.${"0".repeat(64)}`,
      )}`,
    });
    assert.equal(tampered.statusCode, 400);
  });
});

describe("reset-password", () => {
  it("resets the password end-to-end via the emailed token", async () => {
    await registerUser(app, registerPayload());

    await app.inject({
      method: "POST",
      url: `${AUTH}/forgot-password/${encodeURIComponent(testUser.email)}`,
    });

    const token = extractTokenFromEmail(emailCalls()[0]!.html);

    const res = await app.inject({
      method: "POST",
      url: `${AUTH}/reset-password`,
      payload: { token, newPassword: "NewPassword2!" },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().message, "Password reset successfully.");

    const oldLogin = await loginUser(app, { email: testUser.email, password: testUser.password });
    assert.equal(oldLogin.statusCode, 401);

    const newLogin = await loginUser(app, { email: testUser.email, password: "NewPassword2!" });
    assert.equal(newLogin.statusCode, 200);

    const reused = await app.inject({
      method: "POST",
      url: `${AUTH}/reset-password`,
      payload: { token, newPassword: "NewPassword2!" },
    });
    assert.equal(reused.statusCode, 400, "tokens are single-use");
  });

  it("requires a new password to differ from the old one", async () => {
    const user = await User.create({
      fullName: testUser.fullName,
      email: testUser.email,
      password: testUser.password,
      authProviders: ["local"],
    });
    const token = await seedResetToken(user._id.toString());

    const res = await app.inject({
      method: "POST",
      url: `${AUTH}/reset-password`,
      payload: { token, newPassword: testUser.password },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(
      res.json().message,
      "New password must be different from the old password",
    );
  });

  it("validates the new password format", async () => {
    const user = await User.create({
      fullName: testUser.fullName,
      email: testUser.email,
      password: testUser.password,
      authProviders: ["local"],
    });
    const token = await seedResetToken(user._id.toString());

    const res = await app.inject({
      method: "POST",
      url: `${AUTH}/reset-password`,
      payload: { token, newPassword: "weak" },
    });

    assert.equal(res.statusCode, 400);
    assert.ok(Array.isArray(res.json().errors));
  });
});