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
import { S3Client } from "@aws-sdk/client-s3";
import User from "../../src/models/user.model.js";
import Session from "../../src/models/session.model.js";
import UploadSessionModel from "../../src/models/uploadSession.model.js";
import { createTestApp } from "../helpers/app.js";
import { uploadFilePartsSchema } from "../../src/schemas/file.schema.js";
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

const UPLOAD_ENDPOINT = "/api/v1/files/upload";

const MB = 1024 * 1024;
const TERABYTE = 1024 ** 4;

let app: FastifyInstance;

interface VerifiedUser {
  id: string;
  rootFolderId: string;
  cookies: TestCookie[];
}

const createUser = async (
  email: string,
  options: { verifyEmail?: boolean } = {},
) => {
  const registerRes = await registerUser(app, {
    fullName: "Uploader User",
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

  if (options.verifyEmail !== false) {
    await User.updateOne({ _id: user._id }, { isEmailVerified: true });
  }

  return {
    id: user._id.toString(),
    rootFolderId: user.rootFolderId.toString(),
    cookies: toTestCookies(loginRes),
  };
};

const uploadRequest = (
  cookies: TestCookie[],
  body: Record<string, unknown> = {},
) =>
  authedInject(app, cookies, {
    method: "POST",
    url: UPLOAD_ENDPOINT,
    payload: body,
  });

const validBody = (rootFolderId: string) => ({
  name: "photo",
  extension: ".png",
  size: 1024,
  mimeType: "image/png",
  folderId: rootFolderId,
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

describe("POST /api/v1/files/upload", () => {
  it("returns a presigned PUT URL for a small (simple) upload", async () => {
    const user = await createUser("simple.upload@example.com");
    const res = await uploadRequest(user.cookies, validBody(user.rootFolderId));

    assert.equal(res.statusCode, 200, JSON.stringify(res.body));

    const body = res.json();
    assert.equal(body.success, true);
    assert.equal(body.message, "Presigned URL generated successfully");

    const { data } = body;
    assert.equal(data.strategy, "simple");
    assert.match(data.fileId, /^[0-9a-f]{24}$/);

    const url = new URL(data.url);
    assert.ok(
      url.pathname.endsWith(`/files/${data.fileId}`),
      `url path ${url.pathname} must point at files/${data.fileId}`,
    );
    assert.ok(url.searchParams.has("X-Amz-Signature"));
  });

  it("returns only the required fields in the simple upload response", async () => {
    const user = await createUser("fields.upload@example.com");
    const res = await uploadRequest(user.cookies, validBody(user.rootFolderId));

    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.deepEqual(Object.keys(res.json().data).sort(), [
      "fileId",
      "strategy",
      "url",
    ]);
  });

  it("returns a presigned URL for a 10 MB upload (simple strategy)", async () => {
    const user = await createUser("ten.mb@example.com");
    const res = await uploadRequest(user.cookies, {
      name: "medium",
      extension: ".iso",
      size: 10 * MB,
      mimeType: "application/octet-stream",
      folderId: user.rootFolderId,
    });

    assert.equal(res.statusCode, 200, JSON.stringify(res.body));

    const { data } = res.json();
    assert.equal(data.strategy, "simple");
    assert.ok(data.url);

    const url = new URL(data.url);
    assert.ok(url.pathname.endsWith(`/files/${data.fileId}`));
    assert.ok(url.searchParams.has("X-Amz-Signature"));
  });

  it("multipart 50 MB: returns metadata plus a URL for every part", async (t) => {
    const user = await createUser("fifty.mb@example.com");
    const size = 50 * MB;

    t.mock.method(S3Client.prototype, "send", async () => ({
      UploadId: "fifty-mb-upload",
    }));

    const uploadRes = await uploadRequest(user.cookies, {
      name: "film",
      extension: ".mp4",
      size,
      mimeType: "video/mp4",
      folderId: user.rootFolderId,
    });

    assert.equal(uploadRes.statusCode, 200, JSON.stringify(uploadRes.body));

    const { data } = uploadRes.json();
    assert.deepEqual(Object.keys(data).sort(), [
      "fileId",
      "partSize",
      "strategy",
      "totalParts",
      "uploadId",
    ]);
    assert.equal(data.strategy, "multipart");
    assert.equal(data.uploadId, "fifty-mb-upload");
    assert.equal(data.partSize, 10 * MB);
    assert.equal(data.totalParts, 5);

    const partsRes = await authedInject(app, user.cookies, {
      method: "POST",
      url: `${UPLOAD_ENDPOINT}/${data.uploadId}/parts`,
      payload: {},
    });

    assert.equal(partsRes.statusCode, 200, JSON.stringify(partsRes.body));

    const parts = partsRes.json().data.parts as Array<{
      partNumber: number;
      url: string;
    }>;
    assert.equal(parts.length, 5, "50 MB must split into 5 parts");

    for (const part of parts) {
      const url = new URL(part.url);
      assert.ok(
        url.pathname.endsWith(`/files/${data.fileId}`),
        `part ${part.partNumber} must point at files/${data.fileId}`,
      );
      assert.ok(url.searchParams.has("partNumber"));
      assert.equal(url.searchParams.get("partNumber"), String(part.partNumber));
      assert.ok(url.searchParams.has("X-Amz-Signature"));
    }
  });

  it("allows zero-byte uploads (empty files)", async () => {
    const user = await createUser("empty.upload@example.com");
    const res = await uploadRequest(user.cookies, {
      ...validBody(user.rootFolderId),
      size: 0,
    });

    assert.equal(res.statusCode, 200, JSON.stringify(res.body));

    const { data } = res.json();
    assert.equal(data.strategy, "simple");

    const session = await UploadSessionModel.findOne({
      userId: user.id,
    }).lean();
    assert.ok(session, "a session must be created for a 0-byte upload");
    assert.equal(session?.fileSize, 0);
    assert.equal(session?.partSize, null);
    assert.equal(session?.totalParts, null);
  });

  it("persists a simple upload session with a 24h expiry", async () => {
    const user = await createUser("simple.session@example.com");
    await uploadRequest(user.cookies, validBody(user.rootFolderId));

    const session = await UploadSessionModel.findOne({
      userId: user.id,
    }).lean();

    assert.ok(session, "an upload session should be created");
    assert.equal(session?.strategy, "simple");
    assert.equal(session?.status, "uploading");
    assert.equal(session?.fileSize, 1024);
    assert.equal(session?.partSize, null);
    assert.equal(session?.totalParts, null);
    assert.equal(session?.storageUploadId, null);
    assert.equal(
      session?.folderId?.toString(),
      user.rootFolderId,
      "target folder must be persisted on the session",
    );

    const ttlMs = new Date(session?.expiresAt as Date).getTime() - Date.now();
    assert.ok(
      ttlMs > 23 * 60 * 60 * 1000 && ttlMs <= 24 * 60 * 60 * 1000,
      `expected ~24h expiry, got ${ttlMs}ms`,
    );
  });

  it("allows uploading directly to the root with folderId null", async () => {
    const user = await createUser("root.upload@example.com");
    const res = await uploadRequest(user.cookies, {
      ...validBody(user.rootFolderId),
      folderId: null,
    });

    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(res.json().data.strategy, "simple");

    const session = await UploadSessionModel.findOne({
      userId: user.id,
    }).lean();
    assert.equal(session?.folderId, null);
  });

  it("sets a Mongo TTL index so expired sessions are cleaned up", async () => {
    await UploadSessionModel.init();

    const indexes = await UploadSessionModel.collection.indexes();
    const ttl = indexes.find((index) => index.key.expiresAt === 1);

    assert.ok(ttl, "an index on expiresAt should exist");
    assert.equal(
      ttl?.expireAfterSeconds,
      0,
      "expiresAt must be a TTL index (expireAfterSeconds: 0)",
    );
  });

  it("returns multipart metadata for files at or above 20 MB", async (t) => {
    const user = await createUser("multi.upload@example.com");
    const size = 22 * MB;

    t.mock.method(S3Client.prototype, "send", async () => ({
      UploadId: "multipart-upload-123",
    }));

    const res = await uploadRequest(user.cookies, {
      name: "film",
      extension: ".mp4",
      size,
      mimeType: "video/mp4",
      folderId: user.rootFolderId,
    });

    assert.equal(res.statusCode, 200, JSON.stringify(res.body));

    const { data } = res.json();
    assert.equal(data.strategy, "multipart");
    assert.equal(data.uploadId, "multipart-upload-123");
    assert.equal(data.partSize, 10 * MB);
    assert.equal(data.totalParts, Math.ceil(size / (10 * MB)));

    const session = await UploadSessionModel.findOne({
      userId: user.id,
    }).lean();
    assert.equal(session?.strategy, "multipart");
    assert.equal(session?.storageUploadId, "multipart-upload-123");
    assert.equal(session?.partSize, 10 * MB);
    assert.equal(session?.totalParts, 3);
  });

  it("returns presigned URLs for every part of a multipart upload", async (t) => {
    const user = await createUser("parts.upload@example.com");
    const size = 22 * MB;

    t.mock.method(S3Client.prototype, "send", async () => ({
      UploadId: "multipart-upload-123",
    }));

    const uploadRes = await uploadRequest(user.cookies, {
      name: "film",
      extension: ".mp4",
      size,
      mimeType: "video/mp4",
      folderId: user.rootFolderId,
    });
    assert.equal(uploadRes.statusCode, 200, JSON.stringify(uploadRes.body));

    const { data } = uploadRes.json();
    assert.equal(data.strategy, "multipart");

    const res = await authedInject(app, user.cookies, {
      method: "POST",
      url: `${UPLOAD_ENDPOINT}/${data.uploadId}/parts`,
      payload: {},
    });

    assert.equal(res.statusCode, 200, JSON.stringify(res.body));

    const parts = res.json().data.parts as Array<{
      partNumber: number;
      url: string;
    }>;
    assert.equal(parts.length, 3);

    for (const part of parts) {
      assert.ok(part.partNumber >= 1 && part.partNumber <= 3);
      const url = new URL(part.url);
      assert.ok(
        url.pathname.endsWith(`/files/${data.fileId}`),
        `part ${part.partNumber} must point at files/${data.fileId}`,
      );
      assert.ok(url.searchParams.has("X-Amz-Signature"));
      assert.ok(url.searchParams.has("partNumber"));
    }
  });

  it("accepts long S3 upload ids on the parts route (no 414)", async (t) => {
    const user = await createUser("long.parts@example.com");

    t.mock.method(S3Client.prototype, "send", async () => ({
      UploadId: `${"long".padEnd(160, "x")}_${"A".repeat(60)}`,
    }));

    const uploadRes = await uploadRequest(user.cookies, {
      name: "film",
      extension: ".mp4",
      size: 22 * MB,
      mimeType: "video/mp4",
      folderId: user.rootFolderId,
    });
    assert.equal(uploadRes.statusCode, 200, JSON.stringify(uploadRes.body));

    const { data } = uploadRes.json();
    assert.ok(
      data.uploadId.length > 100,
      "fake S3 upload id must exceed Fastify's default maxParamLength of 100",
    );

    const res = await authedInject(app, user.cookies, {
      method: "POST",
      url: `${UPLOAD_ENDPOINT}/${data.uploadId}/parts`,
      payload: {},
    });

    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(res.json().data.parts.length, 3);
  });

  it("returns 404 when part URLs are requested for an unknown uploadId", async () => {
    const user = await createUser("unknown.parts@example.com");

    const res = await authedInject(app, user.cookies, {
      method: "POST",
      url: `${UPLOAD_ENDPOINT}/no-such-upload-id/parts`,
      payload: {},
    });

    assert.equal(res.statusCode, 404);
    assert.equal(res.json().message, "Upload session not found");
  });

  it("splits a 1 TB file into ≤ 10,000 parts of valid S3 size", async (t) => {
    const user = await createUser("terabyte.upload@example.com");
    await User.updateOne(
      { _id: user.id },
      { $set: { storageLimit: 2 * TERABYTE } },
    );

    t.mock.method(S3Client.prototype, "send", async () => ({
      UploadId: "terabyte-upload",
    }));

    const res = await uploadRequest(user.cookies, {
      name: "backup",
      extension: ".tar",
      size: TERABYTE,
      mimeType: "application/x-tar",
      folderId: user.rootFolderId,
    });

    assert.equal(res.statusCode, 200, JSON.stringify(res.body));

    const { data } = res.json();
    assert.equal(data.strategy, "multipart");
    assert.equal(data.partSize, 110_100_480);
    assert.equal(data.totalParts, 9987);
    assert.ok(data.partSize >= 10 * MB, "part size must honor S3's 5MB minimum");
    assert.ok(
      data.partSize * data.totalParts >= TERABYTE,
      "parts must cover the whole file",
    );
  });

  it("accepts S3-style (non-ObjectId) upload ids on the parts route", () => {
    const s3UploadId = "2~bb3jkss2q01aIdjT2V7x6k8LxM~dGPWNlS8WXoGZH0QxJf==";

    assert.doesNotThrow(() =>
      uploadFilePartsSchema.parse({ uploadId: s3UploadId }),
    );
    assert.throws(() => uploadFilePartsSchema.parse({ uploadId: "" }));
  });

  it("rejects an upload that would exceed the storage quota", async () => {
    const user = await createUser("quota.upload@example.com");
    const limit = await User.findById(user.id).select("storageLimit").lean();
    await User.updateOne(
      { _id: user.id },
      { $set: { storageUsed: (limit as { storageLimit: number }).storageLimit } },
    );

    const res = await uploadRequest(user.cookies, validBody(user.rootFolderId));

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().message, "Storage limit exceeded");
  });

  it("rejects an upload into a folder that does not exist", async () => {
    const user = await createUser("missing.folder@example.com");
    const res = await uploadRequest(user.cookies, {
      ...validBody(user.rootFolderId),
      folderId: "000000000000000000000000",
    });

    assert.equal(res.statusCode, 404);
    assert.equal(res.json().message, "Folder not found");
  });

  it("rejects an upload into another user's folder", async () => {
    const owner = await createUser("owner.upload@example.com");
    const intruder = await createUser("intruder.upload@example.com");

    const res = await uploadRequest(intruder.cookies, {
      ...validBody(owner.rootFolderId),
      folderId: owner.rootFolderId,
    });

    assert.equal(res.statusCode, 404);
    assert.equal(res.json().success, false);
  });

  it("rejects an invalid payload with 400", async () => {
    const user = await createUser("invalid.upload@example.com");

    const cases: Record<string, unknown>[] = [
      { ...validBody(user.rootFolderId), extension: "png" },
      { ...validBody(user.rootFolderId), name: "photo.png" },
      { ...validBody(user.rootFolderId), size: -5 },
      { ...validBody(user.rootFolderId), mimeType: "image" },
      { ...validBody(user.rootFolderId), name: "" },
      {},
    ];

    for (const payload of cases) {
      const res = await uploadRequest(user.cookies, payload);
      assert.equal(res.statusCode, 400, JSON.stringify(payload));
      assert.equal(res.json().success, false, JSON.stringify(payload));
    }
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await uploadRequest([], {
      name: "photo",
      extension: ".png",
      size: 1024,
      mimeType: "image/png",
      folderId: null,
    });

    assert.equal(res.statusCode, 401);
  });

  it("returns 403 when the email is not verified", async () => {
    const user = await createUser("unverified.upload@example.com", {
      verifyEmail: false,
    });

    const res = await uploadRequest(user.cookies, validBody(user.rootFolderId));

    assert.equal(res.statusCode, 403);
  });
});