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
import { S3Client } from "@aws-sdk/client-s3";
import User from "../../src/models/user.model.js";
import Folder from "../../src/models/folder.model.js";
import File from "../../src/models/file.model.js";
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

const FILES_ENDPOINT = "/api/v1/files";

let app: FastifyInstance;

interface VerifiedUser {
  id: string;
  rootFolderId: string;
  cookies: TestCookie[];
}

const createVerifiedUser = async (
  email = "renamer@example.com",
): Promise<VerifiedUser> => {
  const registerRes = await registerUser(app, {
    fullName: "Renamer User",
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

const createFile = async (
  userId: string,
  parentFolderId: string,
  overrides: Partial<{
    name: string;
    extension: string;
    mimeType: string;
    size: number;
    deletedAt: Date | null;
  }> = {},
) => {
  return File.create({
    name: "photo",
    extension: ".png",
    size: 1024,
    mimeType: "image/png",
    userId: new mongoose.Types.ObjectId(userId),
    parentFolderId: new mongoose.Types.ObjectId(parentFolderId),
    ...overrides,
  });
};

const renameRequest = (
  cookies: TestCookie[],
  fileId: string,
  name: string,
) =>
  authedInject(app, cookies, {
    method: "PATCH",
    url: `${FILES_ENDPOINT}/${fileId}/name`,
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

describe("PATCH /api/v1/files/:fileId/name", () => {
  it("renames a file successfully and preserves the extension", async () => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId);

    const res = await renameRequest(user.cookies, file._id.toString(), "holiday.png");

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");

    const persisted = await File.findById(file._id).lean();

    assert.equal(persisted?.name, "holiday");
    assert.equal(persisted?.extension, ".png");
  });

  it("allows a multi-part base name like my-photo.png", async () => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId);

    const res = await renameRequest(user.cookies, file._id.toString(), "my-photo.png");

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");
  });

  it("returns 400 for an invalid fileId", async () => {
    const user = await createVerifiedUser();

    const res = await renameRequest(user.cookies, "not-an-object-id", "holiday.png");

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().success, false);
  });

  it("returns 400 for an empty filename", async () => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId);

    const res = await renameRequest(user.cookies, file._id.toString(), "");

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().success, false);
  });

  it("returns 400 for invalid filename characters", async () => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId);

    const res = await renameRequest(user.cookies, file._id.toString(), "bad/name.png");

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().success, false);
  });

  it("returns 400 when the extension is changed", async () => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId);

    const res = await renameRequest(user.cookies, file._id.toString(), "holiday.jpg");

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().message, "File extension cannot be changed");
  });

  it("returns 400 when the extension is removed", async () => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId);

    const res = await renameRequest(user.cookies, file._id.toString(), "holiday");

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().message, "File name must include an extension");
  });

  it("returns 404 for a file belonging to another user", async () => {
    const owner = await createVerifiedUser("owner@example.com");
    const intruder = await createVerifiedUser("intruder@example.com");
    const file = await createFile(owner.id, owner.rootFolderId);

    const res = await renameRequest(intruder.cookies, file._id.toString(), "holiday.png");

    assert.equal(res.statusCode, 404);
    assert.equal(res.json().message, "File not found");
  });

  it("returns 404 for a nonexistent file", async () => {
    const user = await createVerifiedUser();
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await renameRequest(user.cookies, missingId, "holiday.png");

    assert.equal(res.statusCode, 404);
    assert.equal(res.json().message, "File not found");
  });

  it("returns 400 for a file in Trash", async () => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId, {
      deletedAt: new Date(),
    });

    const res = await renameRequest(user.cookies, file._id.toString(), "holiday.png");

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().message, "Cannot rename a file in Trash");
  });

  it("returns 409 when the new name collides in the same folder", async () => {
    const user = await createVerifiedUser();
    await createFile(user.id, user.rootFolderId, {
      name: "holiday",
      extension: ".png",
    });
    const file = await createFile(user.id, user.rootFolderId, {
      name: "photo",
      extension: ".png",
    });

    const res = await renameRequest(user.cookies, file._id.toString(), "holiday.png");

    assert.equal(res.statusCode, 409);
    assert.equal(res.json().message, "A file with this name already exists");
  });

  it("allows the same name in a different folder", async () => {
    const user = await createVerifiedUser();

    const secondFolder = await Folder.create({
      name: "second",
      size: 0,
      userId: new mongoose.Types.ObjectId(user.id),
      parentFolderId: null,
    });

    await createFile(user.id, secondFolder._id.toString(), {
      name: "holiday",
      extension: ".png",
    });

    const file = await createFile(user.id, user.rootFolderId, {
      name: "photo",
      extension: ".png",
    });

    const res = await renameRequest(user.cookies, file._id.toString(), "holiday.png");

    assert.equal(res.statusCode, 204);
  });

  it("does not invoke the storage provider", async (t) => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId);

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => {
      throw new Error("storage must not be invoked during rename");
    });

    const res = await renameRequest(user.cookies, file._id.toString(), "holiday.png");

    assert.equal(res.statusCode, 204);
    assert.equal(sendSpy.mock.callCount(), 0);
  });

  it("handles DB failures through the global error mechanism", async (t) => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId);

    t.mock.method(File, "findByIdAndUpdate", async () => {
      throw new Error("mongodb exploded");
    });

    const res = await renameRequest(user.cookies, file._id.toString(), "holiday.png");

    assert.equal(res.statusCode, 500);
    const body = res.json();

    assert.equal(body.success, false);
    assert.equal(body.message, "Internal Server Error");
    assert.ok(!JSON.stringify(body).includes("mongodb exploded"));
  });
});
