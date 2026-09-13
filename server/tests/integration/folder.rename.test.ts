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
import mongoose from "mongoose";
import User from "../../src/models/user.model.js";
import Folder from "../../src/models/folder.model.js";
import { createTestApp } from "../helpers/app.js";
import {
  authedInject,
  loginUser,
  registerUser,
  toTestCookies,
  type TestCookie,
} from "../helpers/auth.js";
import { connectTestDb, closeTestDb, resetTestDb } from "../setup/db.js";
import { mockRedis, resetRedis } from "../setup/redis.js";
import { mockSendEmail, resetEmailCalls } from "../setup/email.js";
import { VALID_PASSWORD } from "../setup/fixtures.js";

const FOLDERS_ENDPOINT = "/api/v1/folders";

let app: FastifyInstance;

interface VerifiedUser {
  id: string;
  rootFolderId: string;
  cookies: TestCookie[];
}

const createVerifiedUser = async (
  email = "folder-renamer@example.com",
): Promise<VerifiedUser> => {
  const registerRes = await registerUser(app, {
    fullName: "Folder Renamer User",
    email,
    password: VALID_PASSWORD,
  });

  assert.equal(registerRes.statusCode, 201, JSON.stringify(registerRes.body));

  const loginRes = await loginUser(app, {
    email,
    password: VALID_PASSWORD,
  });

  assert.equal(loginRes.statusCode, 200, JSON.stringify(loginRes.body));

  const user = await User.findOne({ email }).lean();

  assert.ok(user, "registered user should exist in DB");
  assert.ok(user.rootFolderId, "registered user should have a root folder");

  await User.updateOne({ _id: user._id }, { isEmailVerified: true });

  return {
    id: user._id.toString(),
    rootFolderId: user.rootFolderId.toString(),
    cookies: toTestCookies(loginRes),
  };
};

const createFolder = async (
  userId: string,
  overrides: Partial<{
    name: string;
    parentFolderId: mongoose.Types.ObjectId | null;
  }> = {},
) => {
  return Folder.create({
    name: "projects",
    size: 0,
    userId: new mongoose.Types.ObjectId(userId),
    parentFolderId: null,
    ...overrides,
  });
};

const renameRequest = (
  cookies: TestCookie[],
  folderId: string,
  name: string,
) =>
  authedInject(app, cookies, {
    method: "PATCH",
    url: `${FOLDERS_ENDPOINT}/${folderId}/name`,
    payload: { name },
  });

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

describe("PATCH /api/v1/folders/:folderId/name", () => {
  it("renames a folder successfully", async () => {
    const user = await createVerifiedUser();
    const folder = await createFolder(user.id);

    const res = await renameRequest(
      user.cookies,
      folder._id.toString(),
      "holiday",
    );

    assert.equal(res.statusCode, 200);

    const body = res.json();

    assert.equal(body.success, true);
    assert.equal(body.message, "Folder renamed successfully");
    assert.equal(body.data.name, "holiday");
    assert.ok(body.data.id);
    assert.ok(body.data.parentFolderId === null || body.data.parentFolderId);

    const persisted = await Folder.findById(folder._id).lean();

    assert.equal(persisted?.name, "holiday");
  });

  it("allows a multi-part name like my-holiday-pics", async () => {
    const user = await createVerifiedUser();
    const folder = await createFolder(user.id);

    const res = await renameRequest(
      user.cookies,
      folder._id.toString(),
      "my-holiday-pics",
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().data.name, "my-holiday-pics");
  });

  it("returns 200 unchanged when the name does not change", async () => {
    const user = await createVerifiedUser();
    const folder = await createFolder(user.id);

    const res = await renameRequest(
      user.cookies,
      folder._id.toString(),
      "projects",
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().data.name, "projects");
  });

  it("returns 400 for an invalid folderId", async () => {
    const user = await createVerifiedUser();

    const res = await renameRequest(user.cookies, "not-an-object-id", "holiday");

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().success, false);
  });

  it("returns 400 for an empty name", async () => {
    const user = await createVerifiedUser();
    const folder = await createFolder(user.id);

    const res = await renameRequest(user.cookies, folder._id.toString(), "");

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().success, false);
  });

  it("returns 400 for invalid name characters", async () => {
    const user = await createVerifiedUser();
    const folder = await createFolder(user.id);

    const res = await renameRequest(
      user.cookies,
      folder._id.toString(),
      "bad/name",
    );

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().success, false);
  });

  it("returns 404 for a folder belonging to another user", async () => {
    const owner = await createVerifiedUser("folder-owner@example.com");
    const intruder = await createVerifiedUser("folder-intruder@example.com");
    const folder = await createFolder(owner.id);

    const res = await renameRequest(
      intruder.cookies,
      folder._id.toString(),
      "holiday",
    );

    assert.equal(res.statusCode, 404);
    assert.equal(res.json().message, "Folder not found");
  });

  it("returns 404 for a nonexistent folder", async () => {
    const user = await createVerifiedUser();
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await renameRequest(user.cookies, missingId, "holiday");

    assert.equal(res.statusCode, 404);
    assert.equal(res.json().message, "Folder not found");
  });

  it("returns 409 when the new name collides in the same folder", async () => {
    const user = await createVerifiedUser();
    await createFolder(user.id, { name: "holiday" });
    const folder = await createFolder(user.id, { name: "projects" });

    const res = await renameRequest(user.cookies, folder._id.toString(), "holiday");

    assert.equal(res.statusCode, 409);
    assert.equal(res.json().message, "A folder with this name already exists in this folder");
  });

  it("allows the same name in a different parent folder", async () => {
    const user = await createVerifiedUser();

    const sibling = await Folder.create({
      name: "sibling",
      size: 0,
      userId: new mongoose.Types.ObjectId(user.id),
      parentFolderId: null,
    });

    const secondFolder = await Folder.create({
      name: "holiday",
      size: 0,
      userId: new mongoose.Types.ObjectId(user.id),
      parentFolderId: new mongoose.Types.ObjectId(sibling._id.toString()),
    });

    const folder = await createFolder(user.id, { name: "projects" });

    const res = await renameRequest(user.cookies, folder._id.toString(), "holiday");

    assert.equal(res.statusCode, 200);
  });

  it("allows renaming a folder while keeping its children intact", async () => {
    const user = await createVerifiedUser();
    const folder = await createFolder(user.id);

    const child = await Folder.create({
      name: "child",
      size: 0,
      userId: new mongoose.Types.ObjectId(user.id),
      parentFolderId: folder._id,
    });

    const res = await renameRequest(user.cookies, folder._id.toString(), "renamed");

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().data.name, "renamed");

    const persistedChild = await Folder.findById(child._id).lean();

    assert.equal(persistedChild?.parentFolderId?.toString(), folder._id.toString());
  });

  it("handles DB failures through the global error mechanism", async (t) => {
    const user = await createVerifiedUser();
    const folder = await createFolder(user.id);

    t.mock.method(Folder, "findByIdAndUpdate", async () => {
      throw new Error("mongodb exploded");
    });

    const res = await renameRequest(user.cookies, folder._id.toString(), "holiday");

    assert.equal(res.statusCode, 500);
    const body = res.json();

    assert.equal(body.success, false);
    assert.equal(body.message, "Internal Server Error");
    assert.ok(!JSON.stringify(body).includes("mongodb exploded"));
  });
});