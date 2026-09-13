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
import File from "../../src/models/file.model.js";
import Session from "../../src/models/session.model.js";
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

const TRASH_ENDPOINT = "/api/v1/trash";

let app: FastifyInstance;

interface VerifiedUser {
  id: string;
  rootFolderId: string;
  cookies: TestCookie[];
}

const createVerifiedUser = async (
  email = "trasher@example.com",
): Promise<VerifiedUser> => {
  const registerRes = await registerUser(app, {
    fullName: "Trasher User",
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
    deletedAt: null,
    ...overrides,
  });
};

const trashRequest = (cookies: TestCookie[], query: Record<string, string>) =>
  authedInject(app, cookies, {
    method: "POST",
    url: `${TRASH_ENDPOINT}?${new URLSearchParams(query).toString()}`,
  });

const restoreRequest = (cookies: TestCookie[], query: Record<string, string>) =>
  authedInject(app, cookies, {
    method: "POST",
    url: `${TRASH_ENDPOINT}/restore?${new URLSearchParams(query).toString()}`,
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

  t.mock.method(Session, "updateOne", async () => ({}));
});

after(async () => {
  await app.close();
  await closeTestDb();
});

describe("POST /api/v1/trash (single file)", () => {
  it("moves an active file to Trash", async () => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId);

    const res = await trashRequest(user.cookies, {
      fileId: file._id.toString(),
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");

    const persisted = await File.findById(file._id).lean();
    assert.ok(persisted?.deletedAt, "deletedAt should be set");
  });

  it("returns 400 for an invalid file ID", async () => {
    const user = await createVerifiedUser();

    const res = await trashRequest(user.cookies, {
      fileId: "not-an-object-id",
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().success, false);
  });

  it("returns 404 when the file does not exist", async () => {
    const user = await createVerifiedUser();
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await trashRequest(user.cookies, { fileId: missingId });

    assert.equal(res.statusCode, 404);
  });

  it("returns 404 and does not trash another user's file", async () => {
    const owner = await createVerifiedUser("owner.trash@example.com");
    const intruder = await createVerifiedUser("intruder.trash@example.com");
    const file = await createFile(owner.id, owner.rootFolderId);

    const res = await trashRequest(intruder.cookies, {
      fileId: file._id.toString(),
    });

    assert.equal(res.statusCode, 404);

    const persisted = await File.findById(file._id).lean();
    assert.equal(persisted?.deletedAt, null, "file must remain active");
  });

  it("returns 400 for a file that is already in Trash", async () => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId, {
      deletedAt: new Date(),
    });

    const res = await trashRequest(user.cookies, {
      fileId: file._id.toString(),
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().message, "File is already in Trash");
  });

  it("does not invoke the storage provider", async (t) => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId);

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => {
      throw new Error("storage must not be invoked during trash");
    });

    const res = await trashRequest(user.cookies, {
      fileId: file._id.toString(),
    });

    assert.equal(res.statusCode, 204);
    assert.equal(sendSpy.mock.callCount(), 0);
  });
});

describe("POST /api/v1/trash/restore (single file)", () => {
  it("restores a trashed file", async () => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId, {
      deletedAt: new Date(),
    });

    const res = await restoreRequest(user.cookies, {
      fileId: file._id.toString(),
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");

    const persisted = await File.findById(file._id).lean();
    assert.equal(persisted?.deletedAt, null, "deletedAt should be cleared");
  });

  it("returns 400 for a file that is not in Trash", async () => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId);

    const res = await restoreRequest(user.cookies, {
      fileId: file._id.toString(),
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().message, "File is not in Trash");
  });

  it("returns 400 for an invalid file ID", async () => {
    const user = await createVerifiedUser();

    const res = await restoreRequest(user.cookies, {
      fileId: "not-an-object-id",
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().success, false);
  });

  it("returns 404 for another user's trashed file", async () => {
    const owner = await createVerifiedUser("owner.restore@example.com");
    const intruder = await createVerifiedUser("intruder.restore@example.com");
    const file = await createFile(owner.id, owner.rootFolderId, {
      deletedAt: new Date(),
    });

    const res = await restoreRequest(intruder.cookies, {
      fileId: file._id.toString(),
    });

    assert.equal(res.statusCode, 404);

    const persisted = await File.findById(file._id).lean();
    assert.ok(persisted?.deletedAt, "foreign file must stay in Trash");
  });

  it("returns 409 when restoring would collide with an active file", async () => {
    const user = await createVerifiedUser();

    await createFile(user.id, user.rootFolderId, {
      name: "photo",
      extension: ".png",
    });
    const trashed = await createFile(user.id, user.rootFolderId, {
      name: "photo",
      extension: ".png",
      deletedAt: new Date(),
    });

    const res = await restoreRequest(user.cookies, {
      fileId: trashed._id.toString(),
    });

    assert.equal(res.statusCode, 409);
    assert.equal(
      res.json().message,
      "A file with this name already exists in this folder",
    );

    const persisted = await File.findById(trashed._id).lean();
    assert.ok(persisted?.deletedAt, "file must stay in Trash on collision");
  });

  it("does not invoke the storage provider", async (t) => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId, {
      deletedAt: new Date(),
    });

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => {
      throw new Error("storage must not be invoked during restore");
    });

    const res = await restoreRequest(user.cookies, {
      fileId: file._id.toString(),
    });

    assert.equal(res.statusCode, 204);
    assert.equal(sendSpy.mock.callCount(), 0);
  });
});

describe("GET /api/v1/trash", () => {
  it("lists only the caller's trashed files and folders", async () => {
    const user = await createVerifiedUser();
    const foreign = await createVerifiedUser("foreign.trash.list@example.com");

    const active = await createFile(user.id, user.rootFolderId);
    const trashed = await createFile(user.id, user.rootFolderId, {
      name: "old",
      extension: ".doc",
      mimeType: "application/msword",
      deletedAt: new Date(),
    });
    await createFile(foreign.id, foreign.rootFolderId, {
      deletedAt: new Date(),
    });

    const res = await authedInject(app, user.cookies, {
      method: "GET",
      url: TRASH_ENDPOINT,
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.files.length, 1);
    assert.deepEqual(body.data.folders, []);

    const listed = body.data.files[0];

    assert.equal(listed.id, trashed._id.toString());
    assert.equal(listed.name, "old");
    assert.equal(listed.extension, ".doc");
    assert.equal(listed.size, trashed.size);
    assert.equal(listed.parentFolderId, user.rootFolderId);
    assert.ok(listed.id !== active._id.toString());
  });

  it("returns empty lists when there is nothing in Trash", async () => {
    const user = await createVerifiedUser();
    await createFile(user.id, user.rootFolderId);

    const res = await authedInject(app, user.cookies, {
      method: "GET",
      url: TRASH_ENDPOINT,
    });

    assert.equal(res.statusCode, 200);
    const data = res.json().data;
    assert.deepEqual(data.files, []);
    assert.deepEqual(data.folders, []);
  });
});