import "../setup/env.js";

import { after, before, beforeEach, describe, it, type SuiteContext, type TestContext } from "node:test";
import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";
import User from "../../src/models/user.model.js";
import Session from "../../src/models/session.model.js";
import { createTestApp } from "../helpers/app.js";
import {
  createAuthedAgent,
  loginUser,
  registerUser,
} from "../helpers/auth.js";
import { connectTestDb, closeTestDb, resetTestDb } from "../setup/db.js";
import { mockRedis, resetRedis } from "../setup/redis.js";
import {
  failVerifyIdToken,
  mockGoogleClient,
  resetGoogleMock,
  setGooglePayload,
} from "../setup/google.js";
import {
  googlePayload,
  googlePayloadVariants,
  registerPayload,
  testUser,
  validJwtLike,
  type GoogleTicket,
} from "../setup/fixtures.js";

const GOOGLE_URL = "/api/v1/auth/google";
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;

let app: FastifyInstance;

before(async () => {
  await connectTestDb();
  app = await createTestApp();
});

beforeEach(async (t: TestContext | SuiteContext) => {
  await resetTestDb();
  resetRedis();
  mockRedis(t as TestContext);
  mockGoogleClient(t as TestContext);
  resetGoogleMock();
  setGooglePayload(googlePayload);
});

after(async () => {
  await app.close();
  await closeTestDb();
});

const googleLogin = async (
  payload: { idToken: string; clientId: string } = {
    idToken: validJwtLike,
    clientId: CLIENT_ID,
  },
): Promise<Awaited<ReturnType<FastifyInstance["inject"]>>> => {
  return app.inject({ method: "POST", url: GOOGLE_URL, payload });
};

describe("POST /api/v1/auth/google", () => {
  it("creates a new google user and signs them in", async () => {
    const res = await googleLogin();

    assert.equal(res.statusCode, 200);

    const body = res.json();

    assert.equal(body.success, true);
    assert.equal(body.data.email, googlePayload.email);
    assert.equal(body.data.fullName, "Ananya kumari");
    assert.equal(body.data.isEmailVerified, true);
    assert.deepEqual(body.data.authProviders, ["google"]);
    assert.equal(body.data.avatar, googlePayload.picture);

    assert.ok(res.cookies.some((c) => c.name === "sid"), "sets session cookie");

    const user = await User.findOne({ googleId: googlePayload.sub });

    assert.ok(user);
    assert.equal(user!.email, googlePayload.email);
  });

  it("merges a Google id into an existing local account by email", async () => {
    await registerUser(app, registerPayload({ email: googlePayload.email }));

    const res = await googleLogin();

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().data.isEmailVerified, false, "local verification flag is preserved");

    const user = await User.findOne({ email: googlePayload.email });

    assert.ok(user);
    assert.equal(user!.googleId, googlePayload.sub);
    assert.deepEqual(user!.authProviders, ["local", "google"]);
    assert.equal(user!.avatar, googlePayload.picture);
  });

  it("refreshes email/name when a returning google user changed them", async () => {
    await googleLogin();
    setGooglePayload({
      ...googlePayload,
      email: "ananya.renamed@gmail.com",
      name: "Ananya Renamed",
    });

    const res = await googleLogin();

    assert.equal(res.statusCode, 200);

    const user = await User.findOne({ googleId: googlePayload.sub });

    assert.ok(user);
    assert.equal(user!.email, "ananya.renamed@gmail.com");
    assert.equal(user!.fullName, "Ananya Renamed");
    assert.equal(await User.countDocuments({ googleId: googlePayload.sub }), 1);
  });

  it("rejects login when already authenticated", async () => {
    await createAuthedAgent(app, testUser);
    const login = await loginUser(app, { email: testUser.email, password: testUser.password });

    const res = await app.inject({
      method: "POST",
      url: GOOGLE_URL,
      payload: { idToken: validJwtLike, clientId: CLIENT_ID },
      cookies: { sid: login.cookies[0]!.value },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().message, "You are already logged in");
  });

  it("blocks a google login past the session cap with 429", async () => {
    await googleLogin();

    const user = await User.findOne({ googleId: googlePayload.sub });
    assert.ok(user);

    for (let i = 0; i < 2; i++) {
      await Session.create({ userId: user!._id, ip: `203.0.113.${i + 50}` });
    }

    const res = await googleLogin();

    assert.equal(res.statusCode, 429);
    assert.match(res.json().message, /maximum of 3 active sessions/);
  });

  it("rejects a mismatched clientId with 400", async () => {
    const res = await googleLogin({ idToken: validJwtLike, clientId: "other.apps.googleusercontent.com" });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().message, "Invalid Google Client ID");
  });

  it("validates the idToken shape", async () => {
    const res = await app.inject({
      method: "POST",
      url: GOOGLE_URL,
      payload: { idToken: "not-a-jwt", clientId: CLIENT_ID },
    });

    assert.equal(res.statusCode, 400);
    assert.ok(Array.isArray(res.json().errors));
  });

  it("maps idToken verification failures to 401", async () => {
    failVerifyIdToken();

    const res = await googleLogin();

    assert.equal(res.statusCode, 401);
    assert.equal(res.json().message, "Invalid Google ID token");
  });

  it("rejects tickets without a sub", async () => {
    setGooglePayload(googlePayloadVariants.noSub);

    const res = await googleLogin();

    assert.equal(res.statusCode, 401);
  });

  it("rejects tickets without an email", async () => {
    setGooglePayload(googlePayloadVariants.noEmail);

    const res = await googleLogin();

    assert.equal(res.statusCode, 401);
    assert.equal(res.json().message, "Google account email is missing");
  });

  it("falls back to the email local-part for unusable names", async () => {
    setGooglePayload(googlePayloadVariants.symbolicName);

    const res = await googleLogin();

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().data.fullName, "ananya google");
  });

  it("keeps unicode names intact", async () => {
    setGooglePayload(googlePayloadVariants.unicodeName);

    const res = await googleLogin();

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().data.fullName, "कौशिक राजपूत");
  });
});