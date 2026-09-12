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

const FILES_ENDPOINT = "/api/v1/files";

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
    _id: mongoose.Types.ObjectId;
    name: string;
    extension: string;
    mimeType: string;
    size: number;
    deletedAt: Date | null;
  }> = {},
) => {
  return File.create({
    _id: new mongoose.Types.ObjectId(),
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

  // `authenticate` fires updateSessionActivity() without awaiting it; that
  // fire-and-forget can write Session.lastActiveAt to Mongo AFTER a fast
  // request ends. Resolve it instantly so no DB op dangles past test close.
  t.mock.method(Session, "updateOne", async () => ({}));
});

after(async () => {
  await app.close();
  await closeTestDb();
});

describe("POST /api/v1/files/:fileId/trash", () => {
  it("moves an active file to Trash", async () => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId);

    const res = await authedInject(app, user.cookies, {
      method: "POST",
      url: `${FILES_ENDPOINT}/${file._id.toString()}/trash`,
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");

    const persisted = await File.findById(file._id).lean();
    assert.ok(persisted?.deletedAt, "deletedAt should be set");
  });

  it("returns 400 for an invalid file ID", async () => {
    const user = await createVerifiedUser();

    const res = await authedInject(app, user.cookies, {
      method: "POST",
      url: `${FILES_ENDPOINT}/not-an-object-id/trash`,
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().success, false);
  });

  it("returns 404 when the file does not exist", async () => {
    const user = await createVerifiedUser();
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await authedInject(app, user.cookies, {
      method: "POST",
      url: `${FILES_ENDPOINT}/${missingId}/trash`,
    });

    assert.equal(res.statusCode, 404);
  });

  it("returns 404 and does not trash another user's file", async () => {
    const owner = await createVerifiedUser("owner.trash@example.com");
    const intruder = await createVerifiedUser("intruder.trash@example.com");
    const file = await createFile(owner.id, owner.rootFolderId);

    const res = await authedInject(app, intruder.cookies, {
      method: "POST",
      url: `${FILES_ENDPOINT}/${file._id.toString()}/trash`,
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

    const res = await authedInject(app, user.cookies, {
      method: "POST",
      url: `${FILES_ENDPOINT}/${file._id.toString()}/trash`,
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

    const res = await authedInject(app, user.cookies, {
      method: "POST",
      url: `${FILES_ENDPOINT}/${file._id.toString()}/trash`,
    });

    assert.equal(res.statusCode, 204);
    assert.equal(sendSpy.mock.callCount(), 0);
  });
});

describe("POST /api/v1/files/:fileId/restore", () => {
  it("restores a trashed file", async () => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId, {
      deletedAt: new Date(),
    });

    const res = await authedInject(app, user.cookies, {
      method: "POST",
      url: `${FILES_ENDPOINT}/${file._id.toString()}/restore`,
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");

    const persisted = await File.findById(file._id).lean();
    assert.equal(persisted?.deletedAt, null, "deletedAt should be cleared");
  });

  it("returns 400 for a file that is not in Trash", async () => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId);

    const res = await authedInject(app, user.cookies, {
      method: "POST",
      url: `${FILES_ENDPOINT}/${file._id.toString()}/restore`,
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().message, "File is not in Trash");
  });

  it("returns 400 for an invalid file ID", async () => {
    const user = await createVerifiedUser();

    const res = await authedInject(app, user.cookies, {
      method: "POST",
      url: `${FILES_ENDPOINT}/not-an-object-id/restore`,
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

    const res = await authedInject(app, intruder.cookies, {
      method: "POST",
      url: `${FILES_ENDPOINT}/${file._id.toString()}/restore`,
    });

    assert.equal(res.statusCode, 404);

    const persisted = await File.findById(file._id).lean();
    assert.ok(persisted?.deletedAt, "foreign file must stay in Trash");
  });

  it("returns 409 when restoring would collide with an active file", async () => {
    const user = await createVerifiedUser();
    const folderId = user.rootFolderId;

    await createFile(user.id, folderId, { name: "photo", extension: ".png" });
    const trashed = await createFile(user.id, folderId, {
      name: "photo",
      extension: ".png",
      deletedAt: new Date(),
    });

    const res = await authedInject(app, user.cookies, {
      method: "POST",
      url: `${FILES_ENDPOINT}/${trashed._id.toString()}/restore`,
    });

    assert.equal(res.statusCode, 409);
    assert.equal(
      res.json().message,
      "A file with this name already exists in this folder",
    );

    const persisted = await File.findById(trashed._id).lean();
    assert.ok(persisted?.deletedAt, "file must stay in Trash on collision");
  });

  it("allows restore when the name is free", async () => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId, {
      name: "holiday",
      extension: ".png",
      deletedAt: new Date(),
    });

    const res = await authedInject(app, user.cookies, {
      method: "POST",
      url: `${FILES_ENDPOINT}/${file._id.toString()}/restore`,
    });

    assert.equal(res.statusCode, 204);

    const persisted = await File.findById(file._id).lean();
    assert.equal(persisted?.deletedAt, null);
  });

  it("does not invoke the storage provider", async (t) => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId, {
      deletedAt: new Date(),
    });

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => {
      throw new Error("storage must not be invoked during restore");
    });

    const res = await authedInject(app, user.cookies, {
      method: "POST",
      url: `${FILES_ENDPOINT}/${file._id.toString()}/restore`,
    });

    assert.equal(res.statusCode, 204);
    assert.equal(sendSpy.mock.callCount(), 0);
  });
});

describe("DELETE /api/v1/files/:fileId/permanent", () => {
  it("permanently deletes a trashed file", async (t) => {
    const user = await createVerifiedUser();
    const fileId = new mongoose.Types.ObjectId().toString();
    await createFile(user.id, user.rootFolderId, {
      _id: new mongoose.Types.ObjectId(fileId),
      deletedAt: new Date(),
    });

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await authedInject(app, user.cookies, {
      method: "DELETE",
      url: `${FILES_ENDPOINT}/${fileId}/permanent`,
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");

    const persisted = await File.findById(fileId).lean();
    assert.equal(persisted, null, "document should be removed");

    assert.equal(sendSpy.mock.callCount(), 1);
    const [command] = sendSpy.mock.calls[0].arguments;
    assert.equal(command.input.Key, `files/${fileId}`);
  });

  it("returns 400 for an active file (must be in Trash first)", async (t) => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId);

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await authedInject(app, user.cookies, {
      method: "DELETE",
      url: `${FILES_ENDPOINT}/${file._id.toString()}/permanent`,
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().message, "File must be in Trash before permanent deletion");
    assert.equal(sendSpy.mock.callCount(), 0, "storage must not be touched");
  });

  it("returns 400 for an invalid file ID", async () => {
    const user = await createVerifiedUser();

    const res = await authedInject(app, user.cookies, {
      method: "DELETE",
      url: `${FILES_ENDPOINT}/not-an-object-id/permanent`,
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().success, false);
  });

  it("returns 404 for a missing file", async () => {
    const user = await createVerifiedUser();
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await authedInject(app, user.cookies, {
      method: "DELETE",
      url: `${FILES_ENDPOINT}/${missingId}/permanent`,
    });

    assert.equal(res.statusCode, 404);
  });

  it("returns 404 for another user's trashed file", async (t) => {
    const owner = await createVerifiedUser("owner.perm@example.com");
    const intruder = await createVerifiedUser("intruder.perm@example.com");

    const file = await createFile(owner.id, owner.rootFolderId, {
      deletedAt: new Date(),
    });

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await authedInject(app, intruder.cookies, {
      method: "DELETE",
      url: `${FILES_ENDPOINT}/${file._id.toString()}/permanent`,
    });

    assert.equal(res.statusCode, 404);
    assert.equal(sendSpy.mock.callCount(), 0);

    const persisted = await File.findById(file._id).lean();
    assert.ok(persisted, "foreign document must remain");
  });

  it("returns an error when storage cleanup fails and keeps the record", async (t) => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId, {
      deletedAt: new Date(),
    });

    t.mock.method(S3Client.prototype, "send", async () => {
      throw new Error("S3 is down");
    });

    const res = await authedInject(app, user.cookies, {
      method: "DELETE",
      url: `${FILES_ENDPOINT}/${file._id.toString()}/permanent`,
    });

    assert.ok(res.statusCode >= 500, `expected 5xx status, got ${res.statusCode}`);
    assert.equal(res.json().success, false);

    const persisted = await File.findById(file._id).lean();
    assert.ok(persisted, "document must remain so the user can retry");
  });

  it("returns a generic 500 when the DB delete fails and does not leak details", async (t) => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId, {
      deletedAt: new Date(),
    });

    t.mock.method(S3Client.prototype, "send", async () => ({}));
    t.mock.method(File, "deleteOne", async () => {
      throw new Error("mongodb exploded");
    });

    const res = await authedInject(app, user.cookies, {
      method: "DELETE",
      url: `${FILES_ENDPOINT}/${file._id.toString()}/permanent`,
    });

    assert.equal(res.statusCode, 500);
    const body = res.json();
    assert.equal(body.message, "Internal Server Error");
    assert.ok(!JSON.stringify(body).includes("mongodb exploded"));
  });
});

describe("GET /api/v1/files/trashed", () => {
  it("lists only the caller's trashed files", async () => {
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
      url: `${FILES_ENDPOINT}/trashed`,
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.success, true);

    assert.equal(body.data.files.length, 1);
    const listed = body.data.files[0];

    assert.equal(listed.id, trashed._id.toString());
    assert.equal(listed.name, "old");
    assert.equal(listed.extension, ".doc");
    assert.equal(listed.size, trashed.size);
    assert.equal(listed.parentFolderId, user.rootFolderId);
    assert.ok(listed.id !== active._id.toString());
  });

  it("returns an empty list when there is nothing in Trash", async () => {
    const user = await createVerifiedUser();
    await createFile(user.id, user.rootFolderId);

    const res = await authedInject(app, user.cookies, {
      method: "GET",
      url: `${FILES_ENDPOINT}/trashed`,
    });

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.json().data.files, []);
  });
});

describe("DELETE /api/v1/files/trashed (empty trash)", () => {
  it("permanently deletes every trashed file for the caller", async (t) => {
    const user = await createVerifiedUser();
    const trashedOne = await createFile(user.id, user.rootFolderId, {
      deletedAt: new Date(),
    });
    const trashedTwo = await createFile(user.id, user.rootFolderId, {
      name: "old",
      extension: ".doc",
      mimeType: "application/msword",
      deletedAt: new Date(),
    });
    const active = await createFile(user.id, user.rootFolderId);

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await authedInject(app, user.cookies, {
      method: "DELETE",
      url: `${FILES_ENDPOINT}/trashed`,
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");

    const remaining = await File.find({ _id: { $in: [trashedOne._id, trashedTwo._id] } }).lean();
    assert.equal(remaining.length, 0, "trashed documents should be removed");

    const activeDoc = await File.findById(active._id).lean();
    assert.ok(activeDoc, "active file must be untouched");

    const keys = sendSpy.mock.calls.map(
      (call) => call.arguments[0].input.Key,
    );
    assert.equal(sendSpy.mock.callCount(), 2);
    assert.ok(keys.includes(`files/${trashedOne._id.toString()}`));
    assert.ok(keys.includes(`files/${trashedTwo._id.toString()}`));
  });

  it("returns an error when storage fails and keeps the records", async (t) => {
    const user = await createVerifiedUser();
    const file = await createFile(user.id, user.rootFolderId, {
      deletedAt: new Date(),
    });

    t.mock.method(S3Client.prototype, "send", async () => {
      throw new Error("S3 is down");
    });

    const res = await authedInject(app, user.cookies, {
      method: "DELETE",
      url: `${FILES_ENDPOINT}/trashed`,
    });

    assert.ok(res.statusCode >= 500, `expected 5xx status, got ${res.statusCode}`);
    assert.equal(res.json().success, false);

    const persisted = await File.findById(file._id).lean();
    assert.ok(persisted, "record must remain for a retry");
  });

  it("is a no-op when the Trash is empty", async (t) => {
    const user = await createVerifiedUser();
    await createFile(user.id, user.rootFolderId);

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await authedInject(app, user.cookies, {
      method: "DELETE",
      url: `${FILES_ENDPOINT}/trashed`,
    });

    assert.equal(res.statusCode, 204);
    assert.equal(sendSpy.mock.callCount(), 0);
  });

  it("only empties the caller's Trash", async (t) => {
    const user = await createVerifiedUser();
    const other = await createVerifiedUser("other.empty@example.com");

    const myTrash = await createFile(user.id, user.rootFolderId, {
      deletedAt: new Date(),
    });
    const otherTrash = await createFile(other.id, other.rootFolderId, {
      deletedAt: new Date(),
    });

    t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await authedInject(app, user.cookies, {
      method: "DELETE",
      url: `${FILES_ENDPOINT}/trashed`,
    });

    assert.equal(res.statusCode, 204);

    const myDoc = await File.findById(myTrash._id).lean();
    assert.equal(myDoc, null);

    const otherDoc = await File.findById(otherTrash._id).lean();
    assert.ok(otherDoc, "another user's trashed file must remain");
  });
});