import "../setup/env.js";

import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import User from "../../src/models/user.model.js";
import Session from "../../src/models/session.model.js";
import { connectTestDb, closeTestDb, resetTestDb } from "../setup/db.js";
import { MAX_SESSIONS } from "../../src/constants/constant.js";
import type { AuthProvider } from "../../src/models/user.model.js";

const validLocal = {
  fullName: "Rohan Sharma",
  email: "rohan@example.com",
  password: "StrongPass1!",
  authProviders: ["local"] as AuthProvider[],
};

const validGoogle = {
  fullName: "Ananya Kumari",
  email: "ananya.google@gmail.com",
  googleId: "google-sub-001",
  authProviders: ["google"] as AuthProvider[],
};

const isValidationError = (err: unknown): boolean =>
  err instanceof Error && err.name === "ValidationError";

const isDuplicateKey = (err: unknown): boolean =>
  err instanceof Error && (err as { code?: number }).code === 11000;

describe("User model", () => {
  before(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  after(async () => {
    await closeTestDb();
  });

  it("applies defaults (avatar, storage, verification) for a local user", async () => {
    const user = await User.create(validLocal);

    assert.equal(user.avatar, "https://res.cloudinary.com/dvhqwwpdl/image/upload/v1777532041/default-avatar_frnvfo.jpg");
    assert.equal(user.storageLimit, 15 * 1024 * 1024 * 1024);
    assert.equal(user.storageUsed, 0);
    assert.equal(user.isEmailVerified, false);
    assert.equal(user.authProviders[0], "local");
  });

  it("verifies google users by default and stores the googleId", async () => {
    const user = await User.create(validGoogle);

    assert.equal(user.isEmailVerified, true);
    assert.equal(user.googleId, "google-sub-001");
    assert.equal(user.password, null);
  });

  it("hashes passwords on save and verifies candidates", async () => {
    const user = await User.create(validLocal);

    assert.match(user.password!, /^\$2/);
    assert.equal(await user.comparePassword("StrongPass1!"), true);
    assert.equal(await user.comparePassword("WrongPass1!"), false);
  });

  it("lowercases emails and trims them", async () => {
    const user = await User.create({
      ...validLocal,
      email: "  MiXeD.Case@Example.COM ",
    });

    assert.equal(user.email, "mixed.case@example.com");
  });

  it("rejects duplicate emails with a duplicate-key error", async () => {
    await User.create(validLocal);

    await assert.rejects(
      User.create({ ...validLocal, email: "rohan@example.com" }),
      isDuplicateKey,
    );
  });

  it("enforces the authProviders enum", async () => {
    const invalidProviders = ["admin"] as unknown as AuthProvider[];

    await assert.rejects(
      User.create({ ...validLocal, authProviders: invalidProviders }),
      (err) =>
        isValidationError(err) &&
        String(err).includes("is not a valid enum value for path `authProviders.0`"),
    );
  });

  it("rejects duplicate providers in authProviders", async () => {
    await assert.rejects(
      User.create({ ...validLocal, authProviders: ["local", "local"] }),
      (err) => isValidationError(err) && String(err).includes("cannot repeat"),
    );
  });

  it("requires a password only for local authProviders", async () => {
    const { password, ...noPasswordLocal } = validLocal;

    await assert.rejects(User.create({ ...noPasswordLocal, authProviders: ["local"] }), (err) =>
      isValidationError(err) &&
      String(err).includes("Password is required for email authentication"),
    );

    void password;
  });

  it("keeps googleId sparse-unique (absent always collides with nothing)", async () => {
    await User.create(validLocal);
    await User.create({ ...validLocal, email: "other@example.com" });

    assert.equal(await User.countDocuments({}), 2);
    assert.equal(await User.countDocuments({ googleId: { $exists: true } }), 0);
  });

  it("rejects a duplicate googleId with a duplicate-key error", async () => {
    await User.create(validGoogle);

    await assert.rejects(
      User.create({
        fullName: "Second Person",
        email: "second@gmail.com",
        googleId: "google-sub-001",
        authProviders: ["google"],
      }),
      isDuplicateKey,
    );
  });

  it("validates fullName content (length + character set incl. unicode)", async () => {
    await assert.rejects(
      User.create({ ...validLocal, fullName: "R" }),
      (err) => isValidationError(err) && String(err).includes("at least 2"),
    );

    await assert.rejects(
      User.create({ ...validLocal, fullName: "Rohan123!" }),
      (err) => isValidationError(err) && String(err).includes("Only letters"),
    );

    const unicode = await User.create({
      ...validLocal,
      fullName: "कौशिक राजपूत",
      email: "unicode@example.com",
    });

    assert.equal(unicode.fullName, "कौशिक राजपूत");
  });

  it("stores the maximum-sessions constant as 3", () => {
    assert.equal(MAX_SESSIONS, 3);
  });
});

describe("Session model", () => {
  before(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  after(async () => {
    await closeTestDb();
  });

  it("applies device/geo defaults and timestamps", async () => {
    const userId = new mongoose.Types.ObjectId();

    const session = await Session.create({ userId, ip: "203.0.113.5" });

    assert.equal(session.device, "unknown");
    assert.equal(session.browserVersion, "unknown");
    assert.equal(session.operatingSystem, "unknown");
    assert.equal(session.countryCode, "unknown");
    assert.equal(session.state, "unknown");
    assert.ok(session.lastActiveAt instanceof Date);
    assert.ok(session.createdAt instanceof Date);
  });

  it("requires a userId and ip", async () => {
    await assert.rejects(Session.create({}), (err) => isValidationError(err));
    await assert.rejects(Session.create({ userId: new mongoose.Types.ObjectId() }), (err) =>
      isValidationError(err),
    );
  });
});