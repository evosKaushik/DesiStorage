import "../setup/env.js";

import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { redisDelete, redisGetJson, redisSetJson } from "../../src/utils/redis.js";
import { fakeRedis, mockRedis, resetRedis } from "../setup/redis.js";

describe("redis JSON helpers", () => {
  beforeEach((t) => {
    resetRedis();
    mockRedis(t);
  });

  it("returns null for a missing key", async () => {
    assert.equal(await redisGetJson("missing"), null);
  });

  it("stores and reads back JSON objects", async () => {
    const value = { a: 1, nested: { b: "c" } };

    await redisSetJson("key-1", value);

    assert.deepEqual(await redisGetJson("key-1"), value);
  });

  it("stores with a TTL", async () => {
    await redisSetJson("short-lived", { x: 1 }, 1);

    assert.ok(await redisGetJson("short-lived"));
  });

  it("returns null for corrupt JSON (originally an OTP string)", async () => {
    await fakeRedis.set("corrupt", "not-json{{");

    assert.equal(await redisGetJson("corrupt"), null);
  });

  it("overwrites existing values", async () => {
    await redisSetJson("key-2", { first: true });
    await redisSetJson("key-2", { second: true });

    assert.deepEqual(await redisGetJson("key-2"), { second: true });
  });

  it("redisDelete removes the key", async () => {
    await redisSetJson("to-delete", { stay: false });
    await redisDelete("to-delete");

    assert.equal(await redisGetJson("to-delete"), null);
  });
});