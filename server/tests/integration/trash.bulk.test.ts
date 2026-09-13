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
const TRASH_BULK_ENDPOINT = `${TRASH_ENDPOINT}/bulk`;
const RESTORE_BULK_ENDPOINT = `${TRASH_ENDPOINT}/restore/bulk`;

let app: FastifyInstance;

interface VerifiedUser {
  id: string;
  rootFolderId: string;
  cookies: TestCookie[];
}

const createVerifiedUser = async (
  email = "bulk.trasher@example.com",
): Promise<VerifiedUser> => {
  const registerRes = await registerUser(app, {
    fullName: "Bulk Trasher",
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

const createFolder = async (
  userId: string,
  overrides: Partial<{
    name: string;
    parentFolderId: mongoose.Types.ObjectId | null;
    deletedAt: Date | null;
  }> = {},
) => {
  return Folder.create({
    name: "projects",
    size: 0,
    userId: new mongoose.Types.ObjectId(userId),
    parentFolderId: null,
    deletedAt: null,
    ...overrides,
  });
};

const trashBulkRequest = (
  cookies: TestCookie[],
  payload: Record<string, unknown>,
) =>
  authedInject(app, cookies, {
    method: "POST",
    url: TRASH_BULK_ENDPOINT,
    payload,
  });

const restoreBulkRequest = (
  cookies: TestCookie[],
  payload: Record<string, unknown>,
) =>
  authedInject(app, cookies, {
    method: "POST",
    url: RESTORE_BULK_ENDPOINT,
    payload,
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

describe("POST /api/v1/trash/bulk", () => {
  it("moves multiple files to Trash and returns counts", async () => {
    const user = await createVerifiedUser();
    const one = await createFile(user.id, user.rootFolderId, { name: "one" });
    const two = await createFile(user.id, user.rootFolderId, { name: "two" });
    const three = await createFile(user.id, user.rootFolderId, {
      name: "three",
    });

    const res = await trashBulkRequest(user.cookies, {
      fileIds: [one._id.toString(), two._id.toString()],
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");

    assert.ok(
      (await File.findById(one._id).lean())?.deletedAt,
      "one should be trashed",
    );
    assert.ok(
      (await File.findById(two._id).lean())?.deletedAt,
      "two should be trashed",
    );
    assert.equal(
      (await File.findById(three._id).lean())?.deletedAt,
      null,
      "three stays active",
    );
  });

  it("trashes a folder together with its whole subtree", async () => {
    const user = await createVerifiedUser();
    const root = await createFolder(user.id);
    const nested = await createFolder(user.id, {
      name: "nested",
      parentFolderId: root._id,
    });
    const fileInRoot = await createFile(
      user.id,
      root._id.toString(),
      { name: "at-root" },
    );
    const fileInNested = await createFile(
      user.id,
      nested._id.toString(),
      { name: "at-nested" },
    );
    const sibling = await createFolder(user.id, { name: "sibling" });

    const res = await trashBulkRequest(user.cookies, {
      folderIds: [root._id.toString()],
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");

    assert.ok((await Folder.findById(root._id).lean())?.deletedAt);
    assert.ok((await Folder.findById(nested._id).lean())?.deletedAt);
    assert.ok((await File.findById(fileInRoot._id).lean())?.deletedAt);
    assert.ok((await File.findById(fileInNested._id).lean())?.deletedAt);
    assert.equal(
      (await Folder.findById(sibling._id).lean())?.deletedAt,
      null,
      "sibling stays active",
    );
  });

  it("skips already-trashed and foreign items", async () => {
    const user = await createVerifiedUser();
    const foreign = await createVerifiedUser("foreign.bulk@example.com");

    const already = await createFile(user.id, user.rootFolderId, {
      deletedAt: new Date(),
    });
    const active = await createFile(user.id, user.rootFolderId, {
      name: "active",
    });
    const foreignFile = await createFile(foreign.id, foreign.rootFolderId, {
      name: "foreign",
    });

    const res = await trashBulkRequest(user.cookies, {
      fileIds: [already._id.toString(), active._id.toString()],
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");

    assert.ok((await File.findById(active._id).lean())?.deletedAt);

    const foreignAfter = await File.findById(foreignFile._id).lean();
    assert.equal(foreignAfter?.deletedAt, null, "foreign file stays active");

    const intruder = await trashBulkRequest(foreign.cookies, {
      fileIds: [active._id.toString()],
    });
    assert.equal(intruder.statusCode, 204);
    assert.equal(intruder.body, "");
  });

  it("returns 400 when no ids are provided", async () => {
    const user = await createVerifiedUser();

    const res = await trashBulkRequest(user.cookies, {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().success, false);
  });

  it("returns 400 when an id is not a valid ObjectId", async () => {
    const user = await createVerifiedUser();

    const res = await trashBulkRequest(user.cookies, {
      fileIds: ["not-an-object-id"],
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().success, false);
  });
});

describe("POST /api/v1/trash/restore/bulk", () => {
  it("restores multiple files from Trash", async () => {
    const user = await createVerifiedUser();
    const one = await createFile(user.id, user.rootFolderId, {
      name: "one",
      deletedAt: new Date(),
    });
    const two = await createFile(user.id, user.rootFolderId, {
      name: "two",
      deletedAt: new Date(),
    });

    const res = await restoreBulkRequest(user.cookies, {
      fileIds: [one._id.toString(), two._id.toString()],
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");

    assert.equal(
      (await File.findById(one._id).lean())?.deletedAt,
      null,
      "one restored",
    );
    assert.equal(
      (await File.findById(two._id).lean())?.deletedAt,
      null,
      "two restored",
    );
  });

  it("restores a whole folder subtree from Trash", async () => {
    const user = await createVerifiedUser();
    const root = await createFolder(user.id, { deletedAt: new Date() });
    const nested = await createFolder(user.id, {
      name: "nested",
      parentFolderId: root._id,
      deletedAt: new Date(),
    });
    const fileInNested = await createFile(
      user.id,
      nested._id.toString(),
      { name: "at-nested", deletedAt: new Date() },
    );

    const res = await restoreBulkRequest(user.cookies, {
      folderIds: [root._id.toString()],
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");

    assert.equal((await Folder.findById(root._id).lean())?.deletedAt, null);
    assert.equal((await Folder.findById(nested._id).lean())?.deletedAt, null);
    assert.equal((await File.findById(fileInNested._id).lean())?.deletedAt, null);
  });

  it("skips a file restore that would collide with an active file", async () => {
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

    const res = await restoreBulkRequest(user.cookies, {
      fileIds: [trashed._id.toString()],
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");
    assert.ok(
      (await File.findById(trashed._id).lean())?.deletedAt,
      "colliding file must stay in Trash",
    );
  });

  it("skips a folder restore that would collide with an active folder", async () => {
    const user = await createVerifiedUser();
    await createFolder(user.id, { name: "projects" });
    const trashed = await createFolder(user.id, {
      name: "projects",
      deletedAt: new Date(),
    });

    const res = await restoreBulkRequest(user.cookies, {
      folderIds: [trashed._id.toString()],
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");
    assert.ok(
      (await Folder.findById(trashed._id).lean())?.deletedAt,
      "colliding folder must stay in Trash",
    );
  });

  it("skips not-in-Trash and foreign items", async () => {
    const user = await createVerifiedUser();
    const foreign = await createVerifiedUser("foreign.restore.bulk@example.com");

    const active = await createFile(user.id, user.rootFolderId, {
      name: "active",
    });

    const res = await restoreBulkRequest(user.cookies, {
      fileIds: [active._id.toString()],
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.body, "");
    assert.equal((await File.findById(active._id).lean())?.deletedAt, null);

    const foreignAfter = await restoreBulkRequest(foreign.cookies, {
      fileIds: [active._id.toString()],
    });
    assert.equal(foreignAfter.statusCode, 204);
    assert.equal(foreignAfter.body, "");
  });

  it("returns 400 when no ids are provided", async () => {
    const user = await createVerifiedUser();

    const res = await restoreBulkRequest(user.cookies, {});

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().success, false);
  });
});
