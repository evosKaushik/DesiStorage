import "../setup/env.js";

import {
  after,
  before,
  beforeEach,
  describe,
  it,
  type SuiteContext,
  type TestContext,
} from "node:test";
import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";
import User from "../../src/models/user.model.js";
import Session from "../../src/models/session.model.js";
import { createTestApp } from "../helpers/app.js";
import {
  authedInject,
  createAuthedAgent,
  loginUser,
  registerUser,
  type TestCookie,
} from "../helpers/auth.js";
import { connectTestDb, closeTestDb, resetTestDb } from "../setup/db.js";
import { fakeRedis, mockRedis, resetRedis } from "../setup/redis.js";
import { mockSendEmail, resetEmailCalls } from "../setup/email.js";
import { loginPayload, registerPayload, testUser } from "../setup/fixtures.js";

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

describe("POST /api/v1/auth/register", () => {
  it("creates a user and never leaks password fields", async () => {
    const res = await registerUser(app, registerPayload());

    assert.equal(res.statusCode, 201);

    const body = res.json();

    assert.equal(body.success, true);
    assert.equal(body.message, "User created successfully");
    assert.equal(body.data.email, testUser.email);
    assert.equal(body.data.fullName, testUser.fullName);
    assert.equal(typeof body.data.id, "string");
    assert.equal(typeof body.data.avatar, "string");
    assert.equal(body.data.storageLimit, 15 * 1024 * 1024 * 1024);
    assert.equal(body.data.storageUsed, 0);
    assert.ok(
      !JSON.stringify(body).toLowerCase().includes("password"),
      "password must never be returned",
    );
  });

  it("rejects duplicate emails with 409", async () => {
    await registerUser(app, registerPayload());
    const res = await registerUser(app, registerPayload());

    assert.equal(res.statusCode, 409);
    assert.equal(res.json().message, "Email already exists");
  });

  it("returns 400 with a structured error list for invalid input", async () => {
    const res = await registerUser(app, {
      fullName: "R",
      email: "not-an-email",
      password: "short",
    });

    assert.equal(res.statusCode, 400);
    const body = res.json();
    assert.equal(body.success, false);
    assert.ok(Array.isArray(body.errors) && body.errors.length > 0);
  });
});

describe("POST /api/v1/auth/login", () => {
  it("logs in and sets an httpOnly, lax, path=/ sid cookie (not secure in test env)", async () => {
    await registerUser(app, registerPayload());
    const res = await loginUser(app, loginPayload());

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().data.isEmailVerified, false);

    const sid = res.cookies.find((c) => c.name === "sid");

    assert.ok(sid, "must set a sid cookie");
    assert.equal(sid!.httpOnly, true);
    assert.equal(sid!.sameSite!.toLowerCase(), "lax");
    assert.equal(sid!.path, "/");
    assert.equal(sid!.maxAge, 2592000, "30 day expiry");
    assert.ok(!sid!.secure, "cookies are not Secure outside production");
  });

  it("is non-enumerating for bad credentials", async () => {
    await registerUser(app, registerPayload());

    const badPassword = await loginUser(app, {
      ...loginPayload(),
      password: "WrongPass1!",
    });
    const badEmail = await loginUser(app, {
      ...loginPayload(),
      email: "ghost@example.com",
    });

    assert.equal(badPassword.statusCode, 401);
    assert.equal(badEmail.statusCode, 401);
    assert.equal(badPassword.json().message, "Invalid email or password");
    assert.equal(badEmail.json().message, "Invalid email or password");
  });

  it("rejects login when already authenticated", async () => {
    await registerUser(app, registerPayload());
    const login = await loginUser(app, loginPayload());

    const again = await app.inject({
      method: "POST",
      url: `${AUTH}/login`,
      payload: loginPayload(),
      cookies: { sid: login.cookies[0]!.value },
    });

    assert.equal(again.statusCode, 400);
    assert.equal(again.json().message, "You are already logged in");
  });

  it("blocks a fourth session with 429", async () => {
    await registerUser(app, registerPayload());

    for (let i = 0; i < 3; i++) {
      const login = await loginUser(app, loginPayload());
      assert.equal(login.statusCode, 200);
    }

    const blocked = await loginUser(app, loginPayload());

    assert.equal(blocked.statusCode, 429);
    assert.match(blocked.json().message, /maximum of 3 active sessions/);
  });
});

describe("GET /api/v1/auth/ (me)", () => {
  it("requires a session", async () => {
    const res = await app.inject({ method: "GET", url: AUTH });

    assert.equal(res.statusCode, 401);
  });

  it("rejects a tampered sid cookie", async () => {
    const { cookies } = await createAuthedAgent(app, testUser);

    const forged: TestCookie = {
      ...cookies[0]!,
      value:
        cookies[0]!.value.slice(0, -1) +
        (cookies[0]!.value.endsWith("a") ? "b" : "a"),
    };

    const res = await authedInject(app, [forged], { method: "GET", url: AUTH });

    assert.equal(res.statusCode, 401);
  });

  it("returns the current user for a valid session", async () => {
    const { cookies } = await createAuthedAgent(app, testUser);

    const res = await authedInject(app, cookies, {
      method: "GET",
      url: AUTH,
    });

    assert.equal(res.statusCode, 200);

    const body = res.json();

    assert.deepEqual(
      Object.keys(body.data).sort(),
      [
        "id",
        "email",
        "fullName",
        "avatar",
        "storageLimit",
        "storageUsed",
        "isEmailVerified",
        "authProviders",
      ].sort(),
    );

    assert.equal(body.data.email, testUser.email);
    assert.equal(body.data.fullName, testUser.fullName);
    assert.equal(body.data.isEmailVerified, false);
    assert.equal(body.data.storageUsed, 0);

    assert.deepEqual(body.data.authProviders, testUser.authProviders);

    assert.ok(body.data.id);
  });

  it("returns 401 when the session no longer exists", async () => {
    const { cookies } = await createAuthedAgent(app, testUser);

    await Session.deleteMany({});

    const res = await authedInject(app, cookies, { method: "GET", url: AUTH });

    assert.equal(res.statusCode, 401);
    assert.match(
      String(res.headers["set-cookie"] ?? ""),
      /sid=/,
      "clears the sid cookie",
    );
  });

  it("returns 401 and revokes the session when the user is deleted", async () => {
    const { cookies } = await createAuthedAgent(app, testUser);

    await User.deleteMany({});

    const res = await authedInject(app, cookies, { method: "GET", url: AUTH });

    assert.equal(res.statusCode, 401);
    assert.equal(await Session.countDocuments({}), 0);
  });
});

describe("email verification (send-email / verify-email)", () => {
  it("sends an OTP once and caches it in redis", async () => {
    const { registerRes, cookies } = await createAuthedAgent(app, testUser);
    const userId = registerRes.json().data.id as string;

    const res = await authedInject(app, cookies, {
      method: "POST",
      url: `${AUTH}/send-email`,
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().message, "OTP sent successfully");

    const otp = await fakeRedis.get(`user:${userId}:otp`);

    assert.match(otp ?? "", /^\d{6}$/);
  });

  it("refuses to resend while an OTP is still valid", async () => {
    const { cookies } = await createAuthedAgent(app, testUser);

    await authedInject(app, cookies, {
      method: "POST",
      url: `${AUTH}/send-email`,
    });
    const res = await authedInject(app, cookies, {
      method: "POST",
      url: `${AUTH}/send-email`,
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().message, "OTP is still valid");
  });

  it("verifies a valid OTP and persists the flag", async () => {
    const { cookies } = await createAuthedAgent(app, testUser);

    const send = await authedInject(app, cookies, {
      method: "POST",
      url: `${AUTH}/send-email`,
    });
    assert.equal(send.statusCode, 200);

    const userId = (await User.findOne({ email: testUser.email })
      .select("_id")
      .lean())!._id;
    const code = (await fakeRedis.get(`user:${userId}:otp`)) ?? "";

    assert.match(code, /^\d{6}$/);

    const res = await authedInject(app, cookies, {
      method: "POST",
      url: `${AUTH}/verify-email`,
      payload: { otp: code },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().message, "Verified successfully");

    const user = await User.findById(userId);
    assert.equal(user!.isEmailVerified, true);
  });

  it("rejects a wrong OTP", async () => {
    const { cookies } = await createAuthedAgent(app, testUser);

    await authedInject(app, cookies, {
      method: "POST",
      url: `${AUTH}/send-email`,
    });

    const res = await authedInject(app, cookies, {
      method: "POST",
      url: `${AUTH}/verify-email`,
      payload: { otp: "000000" },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().message, "Invalid OTP, Please try again");
  });

  it("rejects verification when no OTP exists", async () => {
    const { cookies } = await createAuthedAgent(app, testUser);

    const res = await authedInject(app, cookies, {
      method: "POST",
      url: `${AUTH}/verify-email`,
      payload: { otp: "123456" },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(
      res.json().message,
      "OTP expired or not found, please request a new one",
    );
  });

  it("rejects an already verified account", async () => {
    const { cookies } = await createAuthedAgent(app, testUser);

    await User.updateOne({ email: testUser.email }, { isEmailVerified: true });

    const send = await authedInject(app, cookies, {
      method: "POST",
      url: `${AUTH}/send-email`,
    });
    assert.equal(send.statusCode, 400);
    assert.equal(send.json().message, "Your Email is already Verified");

    const verify = await authedInject(app, cookies, {
      method: "POST",
      url: `${AUTH}/verify-email`,
      payload: { otp: "123456" },
    });
    assert.equal(verify.statusCode, 400);
    assert.equal(verify.json().message, "Your Email is already Verified");
  });

  it("validates the OTP format", async () => {
    const { cookies } = await createAuthedAgent(app, testUser);

    const res = await authedInject(app, cookies, {
      method: "POST",
      url: `${AUTH}/verify-email`,
      payload: { otp: "abc" },
    });

    assert.equal(res.statusCode, 400);
    assert.ok(Array.isArray(res.json().errors));
  });
});

describe("change-password", () => {
  it("rejects an invalid current password", async () => {
    const { cookies } = await createAuthedAgent(app, testUser);

    const res = await authedInject(app, cookies, {
      method: "POST",
      url: `${AUTH}/change-password`,
      payload: { oldPassword: "NotMyPass1!", newPassword: "NextPass1!" },
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.json().message, "Invalid current password");
  });

  it("rejects reusing the same password", async () => {
    const { cookies } = await createAuthedAgent(app, testUser);

    const res = await authedInject(app, cookies, {
      method: "POST",
      url: `${AUTH}/change-password`,
      payload: {
        oldPassword: testUser.password,
        newPassword: testUser.password,
      },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().message, "Validation failed");
    assert.ok(
      Array.isArray(res.json().errors),
      "blocked by the same-password refine in changePasswordSchema",
    );
  });

  it("changes the password and revokes every other session", async () => {
    const { cookies } = await createAuthedAgent(app, testUser);

    const second = await loginUser(app, loginPayload());
    assert.equal(second.statusCode, 200);

    const res = await authedInject(app, cookies, {
      method: "POST",
      url: `${AUTH}/change-password`,
      payload: { oldPassword: testUser.password, newPassword: "NewPassword2!" },
    });

    assert.equal(res.statusCode, 200);

    const remaining = await Session.find({}).lean();
    assert.equal(remaining.length, 1, "only the current session survives");

    const oldLogin = await loginUser(app, loginPayload());
    assert.equal(oldLogin.statusCode, 401);

    const newLogin = await loginUser(app, {
      ...loginPayload(),
      password: "NewPassword2!",
    });
    assert.equal(newLogin.statusCode, 200);

    const me = await authedInject(app, cookies, { method: "GET", url: AUTH });
    assert.equal(
      me.statusCode,
      200,
      "current session stays valid after rotation",
    );
  });

  it("requires authentication", async () => {
    const res = await app.inject({
      method: "POST",
      url: `${AUTH}/change-password`,
      payload: { oldPassword: testUser.password, newPassword: "NewPassword2!" },
    });

    assert.equal(res.statusCode, 401);
  });
});

describe("sessions", () => {
  it("lists the active sessions with isCurrent flags", async () => {
    const { cookies } = await createAuthedAgent(app, testUser);
    await loginUser(app, loginPayload());

    const res = await authedInject(app, cookies, {
      method: "GET",
      url: `${AUTH}/sessions`,
    });

    assert.equal(res.statusCode, 200);

    const sessions = res.json().data as Array<Record<string, unknown>>;

    assert.equal(sessions.length, 2);
    assert.equal(sessions.filter((s) => s.isCurrent).length, 1);
    assert.equal(sessions[0]!.ip, "127.0.0.1");
    assert.equal(typeof sessions[0]!.device, "string");
    assert.equal(typeof sessions[0]!.countryCode, "string");
    assert.equal(typeof sessions[0]!.state, "string");
  });

  it("revokes only sessions owned by the caller", async () => {
    const { cookies } = await createAuthedAgent(app, testUser);
    const other = await createAuthedAgent(app, {
      fullName: "Other Person",
      email: "other@example.com",
      password: "OtherPass1!",
    });
    const otherUserId = other.registerRes.json().data.id as string;

    const otherSession = (await Session.findOne({
      userId: otherUserId,
    }).lean())!;
    const res = await authedInject(app, cookies, {
      method: "POST",
      url: `${AUTH}/logout/${otherSession._id.toString()}`,
    });

    assert.equal(res.statusCode, 403);
    assert.equal(res.json().message, "You can only revoke your own sessions");
  });

  it("returns 404 for a missing session id", async () => {
    const { cookies } = await createAuthedAgent(app, testUser);

    const res = await authedInject(app, cookies, {
      method: "POST",
      url: `${AUTH}/logout/000000000000000000000000`,
    });

    assert.equal(res.statusCode, 404);
  });

  it("logout revokes the current session and clears the cookie", async () => {
    const { cookies } = await createAuthedAgent(app, testUser);

    const res = await authedInject(app, cookies, {
      method: "POST",
      url: `${AUTH}/logout`,
    });

    assert.equal(res.statusCode, 200);

    const me = await authedInject(app, cookies, { method: "GET", url: AUTH });
    assert.equal(me.statusCode, 401);
    assert.match(String(res.headers["set-cookie"] ?? ""), /sid=/);
  });

  it("logout-all removes every other session", async () => {
    const { cookies } = await createAuthedAgent(app, testUser);
    await loginUser(app, loginPayload());

    const res = await authedInject(app, cookies, {
      method: "POST",
      url: `${AUTH}/logout/all`,
    });

    assert.equal(res.statusCode, 200);
    assert.equal(await Session.countDocuments({}), 1);

    const me = await authedInject(app, cookies, { method: "GET", url: AUTH });
    assert.equal(me.statusCode, 200);
  });
});
