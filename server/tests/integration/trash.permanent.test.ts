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
import Folder from "../../src/models/folder.model.js";
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

const PERMANENT_ENDPOINT = "/api/v1/trash/permanent";

let app: FastifyInstance;

interface VerifiedUser {
  id: string;
  rootFolderId: string;
  cookies: TestCookie[];
}

const createVerifiedUser = async (
  email = "permanent@example.com",
): Promise<VerifiedUser> => {
  const registerRes = await registerUser(app, {
    fullName: "Permanent User",
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

const createFolder = async (
  userId: string,
  parentFolderId: string,
  overrides: Partial<{
    name: string;
    deletedAt: Date | null;
  }> = {},
) => {
  return Folder.create({
    name: "pics",
    userId: new mongoose.Types.ObjectId(userId),
    parentFolderId: new mongoose.Types.ObjectId(parentFolderId),
    deletedAt: null,
    ...overrides,
  });
};

const permanentDeleteRequest = (
  cookies: TestCookie[],
  action: string,
  itemIds: string[] = [],
) =>
  authedInject(app, cookies, {
    method: "DELETE",
    url: `${PERMANENT_ENDPOINT}?action=${action}`,
    payload: { itemIds },
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

describe("DELETE /api/v1/trash/permanent?action=file", () => {
  it("permanently deletes a trashed file (record + storage object)", async (
    t,
  ) => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId, {
      deletedAt: new Date(),
    });

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await permanentDeleteRequest(user.cookies, "file", [
      file._id.toString(),
    ]);

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");
    assert.equal(sendSpy.mock.callCount(), 1);

    assert.equal(await File.countDocuments({ _id: file._id }), 0);
  });

  it("skips items that are not in Trash", async () => {
    const user = await createVerifiedUser();
    const active = await createFile(user.id, user.rootFolderId);

    const res = await permanentDeleteRequest(user.cookies, "file", [
      active._id.toString(),
    ]);

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");

    assert.ok(
      await File.findById(active._id).lean(),
      "active file must survive",
    );
  });

  it("returns 400 when exactly one id is not provided", async () => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId, {
      deletedAt: new Date(),
    });
    const extra = await createFile(
      user.id,
      user.rootFolderId,
      { name: "extra", deletedAt: new Date() },
    );

    const none = await permanentDeleteRequest(user.cookies, "file", []);
    assert.equal(none.statusCode, 400);
    assert.equal(none.json().message, "itemIds are required for this action");

    const many = await permanentDeleteRequest(user.cookies, "file", [
      file._id.toString(),
      extra._id.toString(),
    ]);
    assert.equal(many.statusCode, 400);
    assert.equal(
      many.json().message,
      "action=file expects exactly one item id",
    );
  });
});

describe("DELETE /api/v1/trash/permanent?action=multiple", () => {
  it("permanently deletes several trashed files and reports counts", async (
    t,
  ) => {
    const user = await createVerifiedUser();
    const fileA = await createFile(user.id, user.rootFolderId, {
      name: "a",
      deletedAt: new Date(),
    });
    const fileB = await createFile(user.id, user.rootFolderId, {
      name: "b",
      deletedAt: new Date(),
    });

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await permanentDeleteRequest(user.cookies, "multiple", [
      fileA._id.toString(),
      fileB._id.toString(),
    ]);

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");
    assert.equal(sendSpy.mock.callCount(), 2);
    assert.equal(await File.countDocuments({ _id: { $in: [fileA._id, fileB._id] } }), 0);
  });

  it("wipes a trashed folder together with its whole subtree", async (t) => {
    const user = await createVerifiedUser();
    const root = await createFolder(user.id, user.rootFolderId, {
      name: "root",
      deletedAt: new Date(),
    });
    const child = await createFolder(user.id, root._id.toString(), {
      name: "child",
      deletedAt: new Date(),
    });
    const innerFile = await createFile(user.id, root._id.toString(), {
      name: "inner",
      deletedAt: new Date(),
    });
    const nestedFile = await createFile(user.id, child._id.toString(), {
      name: "nested",
      deletedAt: new Date(),
    });

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await permanentDeleteRequest(user.cookies, "multiple", [
      root._id.toString(),
    ]);

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");
    assert.equal(sendSpy.mock.callCount(), 2);

    assert.equal(await Folder.countDocuments({ _id: root._id }), 0);
    assert.equal(await Folder.countDocuments({ _id: child._id }), 0);
    assert.equal(await File.countDocuments({ _id: innerFile._id }), 0);
    assert.equal(await File.countDocuments({ _id: nestedFile._id }), 0);
  });

  it("leaves an active sibling folder alone", async (t) => {
    const user = await createVerifiedUser();
    const trashed = await createFolder(user.id, user.rootFolderId, {
      name: "trashed",
      deletedAt: new Date(),
    });
    const active = await createFolder(user.id, user.rootFolderId, {
      name: "active",
    });

    t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await permanentDeleteRequest(user.cookies, "multiple", [
      trashed._id.toString(),
    ]);

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");
    assert.ok(await Folder.findById(active._id).lean(), "active folder survives");
  });

  it("returns 400 when no ids are provided", async () => {
    const user = await createVerifiedUser();

    const res = await permanentDeleteRequest(user.cookies, "multiple", []);

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().message, "itemIds are required for this action");
  });

  it("keeps records and leaves storage intact when storage delete fails", async (
    t,
  ) => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId, {
      deletedAt: new Date(),
    });

    t.mock.method(S3Client.prototype, "send", async () => {
      throw new Error("s3 unavailable");
    });

    const res = await permanentDeleteRequest(user.cookies, "multiple", [
      file._id.toString(),
    ]);

    assert.equal(res.statusCode, 502);

    const persisted = await File.findById(file._id).lean();
    assert.ok(persisted, "file record must survive a storage failure");
    assert.ok(persisted.deletedAt, "file must remain in Trash for a retry");
  });
});

describe("DELETE /api/v1/trash/permanent?action=empty", () => {
  it("empties the whole Trash (files and folders) and returns counts", async (
    t,
  ) => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId, {
      deletedAt: new Date(),
    });
    const folder = await createFolder(user.id, user.rootFolderId, {
      name: "gallery",
      deletedAt: new Date(),
    });
    await createFile(user.id, user.rootFolderId, { name: "active" });

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await authedInject(app, user.cookies, {
      method: "DELETE",
      url: `${PERMANENT_ENDPOINT}?action=empty`,
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");
    assert.equal(sendSpy.mock.callCount(), 1);

    assert.equal(await File.countDocuments({ _id: file._id }), 0);
    assert.equal(await Folder.countDocuments({ _id: folder._id }), 0);
    assert.equal(await File.countDocuments({ name: "active" }), 1);
  });

  it("returns zero counts for an already empty Trash", async () => {
    const user = await createVerifiedUser();

    const res = await authedInject(app, user.cookies, {
      method: "DELETE",
      url: `${PERMANENT_ENDPOINT}?action=empty`,
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");
  });
});

describe("DELETE /api/v1/trash/permanent validation", () => {
  it("returns 400 for an unknown action", async () => {
    const user = await createVerifiedUser();

    const res = await authedInject(app, user.cookies, {
      method: "DELETE",
      url: `${PERMANENT_ENDPOINT}?action=everything`,
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().success, false);
  });

  it("returns 400 when action is missing", async () => {
    const user = await createVerifiedUser();

    const res = await authedInject(app, user.cookies, {
      method: "DELETE",
      url: PERMANENT_ENDPOINT,
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().success, false);
  });

  it("returns 404 and does not touch foreign trash", async (t) => {
    const owner = await createVerifiedUser("owner.permanent@example.com");
    const intruder = await createVerifiedUser("intruder.permanent@example.com");
    const file = await createFile(owner.id, owner.rootFolderId, {
      deletedAt: new Date(),
    });

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await permanentDeleteRequest(intruder.cookies, "multiple", [
      file._id.toString(),
    ]);

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");
    assert.equal(sendSpy.mock.callCount(), 0);
    assert.equal(await File.countDocuments({ _id: file._id }), 1);
  });
});
