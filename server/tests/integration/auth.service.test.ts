import "../setup/env.js";

import { after, before, beforeEach, describe, it, type SuiteContext, type TestContext } from "node:test";
import assert from "node:assert/strict";
import {
  createUser,
  forgotPassword,
  getUserDetails,
  googleAuthentication,
  loginUser,
  resetPassword,
  sendOTPToEmail,
  verifyResetPasswordToken,
} from "../../src/services/auth.service.js";
import { connectTestDb, closeTestDb, resetTestDb } from "../setup/db.js";
import { fakeRedis, mockRedis, resetRedis } from "../setup/redis.js";
import {
  failVerifyIdToken,
  mockGoogleClient,
  resetGoogleMock,
  setGooglePayload,
} from "../setup/google.js";
import {
  emailCalls,
  failNextSend,
  mockSendEmail,
  resetEmailCalls,
} from "../setup/email.js";
import Session from "../../src/models/session.model.js";
import User from "../../src/models/user.model.js";
import { buildPasswordResetToken, generatePasswordResetToken } from "../../src/utils/hash.js";
import { passwordResetRedisKey } from "../../src/utils/cacheKeys.js";
import { ApiError } from "../../src/utils/ApiError.js";
import {
  googlePayload,
  googlePayloadVariants,
  testUser,
  validJwtLike,
} from "../setup/fixtures.js";

const seedResetToken = async (userId: string): Promise<string> => {
  const random = generatePasswordResetToken();

  await fakeRedis.set(passwordResetRedisKey(random), userId, { EX: 600 });

  return buildPasswordResetToken(userId, random);
};

describe("auth.service", () => {
  before(async () => {
    await connectTestDb();
  });

  beforeEach(async (t: TestContext | SuiteContext) => {
    await resetTestDb();
    resetRedis();
    resetGoogleMock();
    mockRedis(t as TestContext);
    mockGoogleClient(t as TestContext);
    mockSendEmail(t as TestContext);
    resetEmailCalls();
  });

  after(async () => {
    await closeTestDb();
  });

  describe("createUser", () => {
    it("creates a local user with a hashed password", async () => {
      const user = await createUser(testUser);

      assert.equal(user.email, "rohan.sharma@example.com");
      assert.equal(user.isEmailVerified, false);
      assert.deepEqual(user.authProviders, ["local"]);
    });

    it("rejects duplicate emails (case-insensitive)", async () => {
      await createUser(testUser);

      await assert.rejects(
        createUser({ ...testUser, email: "ROHAN.SHARMA@example.com" }),
        (err) => err instanceof ApiError && err.statusCode === 409,
      );
    });
  });

  describe("loginUser", () => {
    it("rejects unknown emails with a single non-enumerating message", async () => {
      const a = await createUser(testUser);

      await assert.rejects(
        loginUser({ email: "ghost@example.com", password: "StrongPass1!" }),
        (err) => err instanceof ApiError && err.message === "Invalid email or password",
      );

      const b = await User.findById(a._id);
      assert.ok(b);
    });

    it("rejects wrong passwords with the same message", async () => {
      await createUser(testUser);

      await assert.rejects(
        loginUser({ email: testUser.email, password: "WrongPass1!" }),
        (err) => err instanceof ApiError && err.message === "Invalid email or password",
      );
    });

    it("returns the public profile on success", async () => {
      await createUser(testUser);

      const session = await loginUser({ email: testUser.email, password: testUser.password });

      assert.ok(session.id, "returns a user id");
      assert.equal(session.email, "rohan.sharma@example.com");
      assert.equal(session.isEmailVerified, false);
      assert.deepEqual(session.authProviders, ["local"]);
      assert.equal(session.storageUsed, 0);
    });

    it("fails with 429 once the session cap is reached", async () => {
      const user = await createUser(testUser);

      for (let i = 0; i < 3; i++) {
        await Session.create({ userId: user._id, ip: `203.0.113.${i}` });
      }

      await assert.rejects(
        loginUser({ email: testUser.email, password: testUser.password }),
        (err) => err instanceof ApiError && err.statusCode === 429,
      );
    });
  });

  describe("getUserDetails", () => {
    it("returns a flattened user for an existing id", async () => {
      const user = await createUser(testUser);

      const details = await getUserDetails(user._id.toString());

      assert.equal((details as { email: string }).email, "rohan.sharma@example.com");
    });

    it("throws 404 for a missing user", async () => {
      await assert.rejects(
        getUserDetails("000000000000000000000000"),
        (err) => err instanceof ApiError && err.statusCode === 404,
      );
    });
  });

  describe("sendOTPToEmail", () => {
    it("sends the OTP email with the code embedded", async () => {
      await sendOTPToEmail("r@example.com", "123456", "Rohan");

      assert.equal(emailCalls().length, 1);
      assert.equal(emailCalls()[0]!.receiver, "r@example.com");
      assert.match(emailCalls()[0]!.html, /123456/);
    });

    it("throws a generic message when the mailer fails", async (t) => {
      failNextSend(t);

      await assert.rejects(
        sendOTPToEmail("r@example.com", "123456", "Rohan"),
        (err) => err instanceof Error && err.message === "Failed to send OTP email",
      );
    });
  });

  describe("forgotPassword", () => {
    it("sends a reset email containing a token and seeds redis", async () => {
      const user = await createUser(testUser);

      await forgotPassword(user.email);

      assert.equal(emailCalls().length, 1);
      assert.match(emailCalls()[0]!.html, /\/reset-password\?token=/);
      assert.ok(emailCalls()[0]!.receiver === user.email);

      const cooldown = await fakeRedis.get(`password-reset:cooldown:${user._id}`);
      assert.equal(cooldown, "1");
    });

    it("does not reveal whether an email exists", async () => {
      await forgotPassword("ghost@example.com");

      assert.equal(emailCalls().length, 0);
    });

    it("throws 429 when a reset was already requested", async () => {
      const user = await createUser(testUser);

      await forgotPassword(user.email);

      await assert.rejects(
        forgotPassword(user.email),
        (err) => err instanceof ApiError && err.statusCode === 429,
      );
    });

    it("rolls back redis and returns 503 when the mailer fails", async (t) => {
      const user = await createUser(testUser);

      failNextSend(t);

      await assert.rejects(
        forgotPassword(user.email),
        (err) => err instanceof ApiError && err.statusCode === 503,
      );

      const cooldown = await fakeRedis.get(`password-reset:cooldown:${user._id}`);
      assert.equal(cooldown, null);
    });
  });

  describe("verifyResetPasswordToken", () => {
    it("accepts a valid, seeded token", async () => {
      const user = await createUser(testUser);
      const token = await seedResetToken(user._id.toString());

      await verifyResetPasswordToken(token);
    });

    it("rejects tampered tokens and consumed tokens", async () => {
      const user = await createUser(testUser);
      const token = await seedResetToken(user._id.toString());

      const [payload] = token.split(".");

      await assert.rejects(
        verifyResetPasswordToken(`${payload}.${"0".repeat(64)}`),
        (err) => err instanceof ApiError && err.statusCode === 400,
      );

      await verifyResetPasswordToken(token);

      await assert.rejects(
        verifyResetPasswordToken(token),
        (err) => err instanceof ApiError && err.statusCode === 400,
      );
    });

    it("rejects a token whose userId is not an ObjectId", async () => {
      const user = await createUser(testUser);

      const { buildPasswordResetToken: build } = await import("../../src/utils/hash.js");

      const token = build("not-an-object-id", "nonce");
      const { passwordResetRedisKey: key } = await import("../../src/utils/cacheKeys.js");

      await fakeRedis.set(key("nonce"), user._id.toString(), { EX: 600 });

      await assert.rejects(
        verifyResetPasswordToken(token),
        (err) => err instanceof ApiError && err.statusCode === 400,
      );
    });
  });

  describe("resetPassword", () => {
    it("resets the password and revokes existing sessions", async () => {
      const user = await createUser(testUser);
      await Session.create({ userId: user._id, ip: "203.0.113.9" });

      const token = await seedResetToken(user._id.toString());

      await resetPassword(token, "NewPassword2!");

      const sessions = await Session.countDocuments({ userId: user._id });
      assert.equal(sessions, 0);

      await assert.rejects(
        loginUser({ email: testUser.email, password: testUser.password }),
        (err) => err instanceof ApiError,
      );

      const fresh = await loginUser({ email: testUser.email, password: "NewPassword2!" });
      assert.equal(fresh.id.toString(), user._id.toString());
    });

    it("rejects reusing the same token", async () => {
      const user = await createUser(testUser);
      const token = await seedResetToken(user._id.toString());

      await resetPassword(token, "NewPassword2!");

      await assert.rejects(
        resetPassword(token, "AnotherPass3!"),
        (err) => err instanceof ApiError && err.statusCode === 400,
      );
    });

    it("requires the new password to differ", async () => {
      const user = await createUser(testUser);
      const token = await seedResetToken(user._id.toString());

      await assert.rejects(
        resetPassword(token, testUser.password),
        (err) =>
          err instanceof ApiError &&
          err.message === "New password must be different from the old password",
      );
    });
  });

  describe("googleAuthentication", () => {
    it("creates a new user from the token payload", async () => {
      setGooglePayload(googlePayload);

      const result = await googleAuthentication(validJwtLike);

      assert.equal(result.email, googlePayload.email);
      assert.equal(result.isEmailVerified, true);
      assert.deepEqual(result.authProviders, ["google"]);
      assert.equal(result.avatar, googlePayload.picture);

      const user = await User.findOne({ googleId: googlePayload.sub });
      assert.ok(user);
      assert.equal(user!.fullName, "Ananya kumari");
    });

    it("sanitizes unicode names", async () => {
      setGooglePayload(googlePayloadVariants.unicodeName);

      const result = await googleAuthentication(validJwtLike);

      assert.equal(result.fullName, "कौशिक राजपूत");
    });

    it("falls back to the email local-part for unusable names", async () => {
      setGooglePayload(googlePayloadVariants.symbolicName);

      const result = await googleAuthentication(validJwtLike);

      assert.equal(result.fullName, "ananya google");
    });

    it("merges into an existing local user by email", async () => {
      await createUser({ ...testUser, email: googlePayload.email });
      setGooglePayload(googlePayload);

      const result = await googleAuthentication(validJwtLike);

      const user = await User.findOne({ email: googlePayload.email });

      assert.ok(user);
      assert.equal(user!.googleId, googlePayload.sub);
      assert.deepEqual(user!.authProviders, ["local", "google"]);
      assert.equal(user!.avatar, googlePayload.picture);
      assert.equal(result.id.toString(), user!._id.toString());
    });

    it("keeps emailless and subless tokens at bay", async () => {
      setGooglePayload(googlePayloadVariants.noSub);
      await assert.rejects(
        googleAuthentication(validJwtLike),
        (err) => err instanceof ApiError && err.statusCode === 401,
      );

      setGooglePayload(googlePayloadVariants.noEmail);
      await assert.rejects(
        googleAuthentication(validJwtLike),
        (err) =>
          err instanceof ApiError && err.message === "Google account email is missing",
      );
    });

    it("maps verifyIdToken failures to a 401", async () => {
      failVerifyIdToken();

      await assert.rejects(
        googleAuthentication(validJwtLike),
        (err) => err instanceof ApiError && err.statusCode === 401,
      );
    });
  });
});