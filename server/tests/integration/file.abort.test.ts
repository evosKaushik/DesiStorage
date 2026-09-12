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
import { fakeRedis, mockRedis, resetRedis } from "../setup/redis.js";
import { mockSendEmail, resetEmailCalls } from "../setup/email.js";
import { VALID_PASSWORD } from "../setup/fixtures.js";
import { uploadIdKey } from "../../src/utils/cacheKeys.js";
import { ONE_HOUR } from "../../src/constants/constant.js";
import type { PendingUpload } from "../../src/types/file.types.js";

const FILES_ENDPOINT = "/api/v1/files";

let app: FastifyInstance;

interface VerifiedUser {
  id: string;
  rootFolderId: string;
  cookies: TestCookie[];
}

const createVerifiedUser = async (
  email = "aborter@example.com",
): Promise<VerifiedUser> => {
  const registerRes = await registerUser(app, {
    fullName: "Aborter User",
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
    ...overrides,
  });
};

const setPendingSession = async (
  fileId: string,
  session: PendingUpload,
) => {
  await fakeRedis.set(uploadIdKey(fileId), JSON.stringify(session), {
    EX: ONE_HOUR,
  });
};

const getPendingSession = async (fileId: string) => {
  return fakeRedis.get(uploadIdKey(fileId));
};

const setAbortedTombstone = async (fileId: string) => {
  await fakeRedis.set(
    `upload:${fileId}:aborted`,
    JSON.stringify({ abortedAt: Date.now() }),
    { EX: ONE_HOUR },
  );
};

const abortRequest = (cookies: TestCookie[], fileId: string) =>
  authedInject(app, cookies, {
    method: "POST",
    url: `${FILES_ENDPOINT}/upload/${fileId}/abort`,
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

  // `authenticate` fires updateSessionActivity() without awaiting it; that
  // fire-and-forget can write Session.lastActiveAt to Mongo AFTER a fast
  // request ends. Resolve it instantly so no DB op dangles past test close.
  t.mock.method(Session, "updateOne", async () => ({}));
});

after(async () => {
  await app.close();
  await closeTestDb();
});

describe("POST /api/v1/files/upload/:fileId/abort", () => {
  it("succeeds when the upload is pending and deletes the S3 object", async (t) => {
    const user = await createVerifiedUser();
    const fileId = new mongoose.Types.ObjectId().toString();

    await setPendingSession(fileId, {
      userId: user.id,
      name: "photo",
      parentId: user.rootFolderId,
      expectedSize: 1024,
      extension: ".png",
      mimeType: "image/png",
    });

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await abortRequest(user.cookies, fileId);

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");

    const session = await getPendingSession(fileId);
    assert.equal(session, null, "pending session should be removed");

    const tombstone = await fakeRedis.get(`upload:${fileId}:aborted`);
    assert.ok(tombstone, "aborted tombstone should be set");

    assert.equal(sendSpy.mock.callCount(), 1);
    const [command] = sendSpy.mock.calls[0].arguments;
    assert.equal(command.input.Key, `files/${fileId}`);
  });

  it("succeeds identically when the upload is in an active uploading state", async (t) => {
    const user = await createVerifiedUser();
    const fileId = new mongoose.Types.ObjectId().toString();

    await setPendingSession(fileId, {
      userId: user.id,
      name: "video",
      parentId: user.rootFolderId,
      expectedSize: 5242880,
      extension: ".mp4",
      mimeType: "video/mp4",
    });

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await abortRequest(user.cookies, fileId);

    assert.equal(res.statusCode, 204);
    assert.equal(sendSpy.mock.callCount(), 1);

    const session = await getPendingSession(fileId);
    assert.equal(session, null);
  });

  it("returns 400 for an invalid file ID", async () => {
    const user = await createVerifiedUser();

    const res = await abortRequest(user.cookies, "not-an-object-id");

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().success, false);
  });

  it("returns 404 when the file is not found", async () => {
    const user = await createVerifiedUser();
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await abortRequest(user.cookies, missingId);

    assert.equal(res.statusCode, 404);
  });

  it("returns 404 and does not disturb a foreign user's upload", async (t) => {
    const owner = await createVerifiedUser("owner.abort@example.com");
    const intruder = await createVerifiedUser("intruder.abort@example.com");
    const fileId = new mongoose.Types.ObjectId().toString();

    await setPendingSession(fileId, {
      userId: owner.id,
      name: "secret",
      parentId: owner.rootFolderId,
      expectedSize: 1024,
      extension: ".png",
      mimeType: "image/png",
    });

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await abortRequest(intruder.cookies, fileId);

    assert.equal(res.statusCode, 404);

    const session = await getPendingSession(fileId);
    assert.ok(session, "foreign session must remain untouched");

    assert.equal(sendSpy.mock.callCount(), 0, "storage must not be called for a foreign user");
  });

  it("returns 400 for a file that was already aborted", async (t) => {
    const user = await createVerifiedUser();
    const fileId = new mongoose.Types.ObjectId().toString();

    await setPendingSession(fileId, {
      userId: user.id,
      name: "photo",
      parentId: user.rootFolderId,
      expectedSize: 1024,
      extension: ".png",
      mimeType: "image/png",
    });

    t.mock.method(S3Client.prototype, "send", async () => ({}));

    const firstRes = await abortRequest(user.cookies, fileId);
    assert.equal(firstRes.statusCode, 204);

    const secondRes = await abortRequest(user.cookies, fileId);
    assert.equal(secondRes.statusCode, 400);
    assert.equal(secondRes.json().message, "Upload already aborted");
  });

  it("returns 409 for a file that already completed", async (t) => {
    const user = await createVerifiedUser();
    const fileId = new mongoose.Types.ObjectId().toString();

    await setPendingSession(fileId, {
      userId: user.id,
      name: "photo",
      parentId: user.rootFolderId,
      expectedSize: 1024,
      extension: ".png",
      mimeType: "image/png",
    });

    // Simulate completion by consuming the session and creating the File doc.
    await fakeRedis.getDel(uploadIdKey(fileId));

    await createFile(user.id, user.rootFolderId, {
      _id: new mongoose.Types.ObjectId(fileId),
      name: "photo",
      extension: ".png",
    });

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await abortRequest(user.cookies, fileId);

    assert.equal(res.statusCode, 409);
    assert.equal(res.json().message, "Upload already completed");
    assert.equal(sendSpy.mock.callCount(), 0, "storage must not be deleted for a completed file");
  });

  it("returns an error when storage cleanup fails", async (t) => {
    const user = await createVerifiedUser();
    const fileId = new mongoose.Types.ObjectId().toString();

    await setPendingSession(fileId, {
      userId: user.id,
      name: "photo",
      parentId: user.rootFolderId,
      expectedSize: 1024,
      extension: ".png",
      mimeType: "image/png",
    });

    t.mock.method(S3Client.prototype, "send", async () => {
      throw new Error("S3 is down");
    });

    const res = await abortRequest(user.cookies, fileId);

    assert.ok(res.statusCode >= 500, `expected 5xx status, got ${res.statusCode}`);
    const body = res.json();
    assert.equal(body.success, false);
    assert.ok(!JSON.stringify(body).includes("S3 is down"));

    // Session should be restored so the user can retry.
    const session = await getPendingSession(fileId);
    assert.ok(session, "session should be restored after storage failure");
  });

  it("returns a generic 500 when the database is unavailable", async (t) => {
    const user = await createVerifiedUser();
    const fileId = new mongoose.Types.ObjectId().toString();

    // No session in Redis — forces the resolution path that checks File.exists.
    t.mock.method(File, "exists", async () => {
      throw new Error("mongodb exploded");
    });

    const res = await abortRequest(user.cookies, fileId);

    assert.equal(res.statusCode, 500);
    const body = res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Internal Server Error");
    assert.ok(!JSON.stringify(body).includes("mongodb exploded"));
  });

  it("does not delete storage when the user is not authenticated", async (t) => {
    const user = await createVerifiedUser();
    const fileId = new mongoose.Types.ObjectId().toString();

    await setPendingSession(fileId, {
      userId: user.id,
      name: "photo",
      parentId: user.rootFolderId,
      expectedSize: 1024,
      extension: ".png",
      mimeType: "image/png",
    });

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await abortRequest([], fileId);

    assert.ok(res.statusCode >= 400, `expected 4xx status, got ${res.statusCode}`);
    assert.equal(sendSpy.mock.callCount(), 0);
  });

  it("does not delete storage when cleanup is unnecessary (foreign)", async (t) => {
    const owner = await createVerifiedUser("owner2.abort@example.com");
    const intruder = await createVerifiedUser("intruder2.abort@example.com");
    const fileId = new mongoose.Types.ObjectId().toString();

    await setPendingSession(fileId, {
      userId: owner.id,
      name: "secret",
      parentId: owner.rootFolderId,
      expectedSize: 1024,
      extension: ".png",
      mimeType: "image/png",
    });

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await abortRequest(intruder.cookies, fileId);

    assert.equal(res.statusCode, 404);
    assert.equal(sendSpy.mock.callCount(), 0);
  });

  it("calls the storage provider exactly once when cleanup is required", async (t) => {
    const user = await createVerifiedUser();
    const fileId = new mongoose.Types.ObjectId().toString();

    await setPendingSession(fileId, {
      userId: user.id,
      name: "photo",
      parentId: user.rootFolderId,
      expectedSize: 1024,
      extension: ".png",
      mimeType: "image/png",
    });

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => ({}));

    const res = await abortRequest(user.cookies, fileId);

    assert.equal(res.statusCode, 204);
    assert.equal(sendSpy.mock.callCount(), 1, "should delete exactly once");
  });

  it("does not allow the client to supply an arbitrary storage key", async (t) => {
    const user = await createVerifiedUser();
    const fileId = new mongoose.Types.ObjectId().toString();

    await setPendingSession(fileId, {
      userId: user.id,
      name: "photo",
      parentId: user.rootFolderId,
      expectedSize: 1024,
      extension: ".png",
      mimeType: "image/png",
    });

    const sendSpy = t.mock.method(S3Client.prototype, "send", async () => ({}));

    // Body is ignored by the route (no body schema), but confirm it has no effect.
    await authedInject(app, user.cookies, {
      method: "POST",
      url: `${FILES_ENDPOINT}/upload/${fileId}/abort`,
      payload: { storageKey: "/etc/passwd" },
    });

    assert.equal(sendSpy.mock.callCount(), 1);
    const [command] = sendSpy.mock.calls[0].arguments;
    assert.equal(command.input.Key, `files/${fileId}`);
  });
});
