import "../setup/env.js";

import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { FastifyInstance } from "fastify";
import User from "../../src/models/user.model.js";
import { ApiError } from "../../src/utils/ApiError.js";
import { createTestApp } from "../helpers/app.js";
import { registerUser } from "../helpers/auth.js";
import { connectTestDb, closeTestDb, resetTestDb } from "../setup/db.js";
import { mockRedis, resetRedis } from "../setup/redis.js";
import { registerPayload, testUser } from "../setup/fixtures.js";

const errorRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/__test/api-error", async () => {
    throw new ApiError(403, "Forbidden from handler");
  });

  app.get("/__test/boom", async () => {
    throw new Error("boom");
  });

  app.get("/__test/dup", async () => {
    const error = new Error("E11000 duplicate key") as Error & { code: number };
    error.code = 11000;
    throw error;
  });
};

let app: FastifyInstance;

before(async () => {
  await connectTestDb();
  app = await createTestApp();
  await app.register(errorRoutes);
});

beforeEach(async (t) => {
  await resetTestDb();
  resetRedis();
  mockRedis(t);
});

after(async () => {
  await app.close();
  await closeTestDb();
});

describe("error handling", () => {
  it("wraps ApiError into { success:false } with its status", async () => {
    const res = await app.inject({ method: "GET", url: "/__test/api-error" });

    assert.equal(res.statusCode, 403);
    assert.equal(res.json().success, false);
    assert.equal(res.json().message, "Forbidden from handler");
  });

  it("normalizes unexpected errors to 500 without leaking the stack", async () => {
    const res = await app.inject({ method: "GET", url: "/__test/boom" });

    assert.equal(res.statusCode, 500);
    assert.equal(res.json().success, false);
    assert.ok(!JSON.stringify(res.json()).includes("at "), "stack frames must not leak");
  });

  it("maps mongo duplicate-key errors to 409", async () => {
    const res = await app.inject({ method: "GET", url: "/__test/dup" });

    assert.equal(res.statusCode, 409);
    assert.equal(res.json().message, "Email already exists");
  });

  it("returns a structured 400 for validation failures", async () => {
    const res = await registerUser(app, {
      fullName: "R",
      email: "nope",
      password: "weak",
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json().success, false);
    assert.ok(Array.isArray(res.json().errors) && res.json().errors.length >= 1);
  });
});

describe("input hardening", () => {
  it("strips injected/mass-assigned fields on register", async () => {
    const overrides: Record<string, unknown> = {
      admin: true,
      role: "superuser",
      isEmailVerified: true,
      storageLimit: 999,
    };

    const res = await registerUser(app, { ...registerPayload(), ...overrides });

    assert.equal(res.statusCode, 201);

    const user = await User.findOne({ email: testUser.email }).lean();

    assert.ok(user);
    assert.equal(user!.storageLimit, 15 * 1024 * 1024 * 1024);
    assert.equal((user as unknown as Record<string, unknown>).admin, undefined);
    assert.equal((user as unknown as Record<string, unknown>).role, undefined);
  });

  it("rejects NoSQL operator injection in login", async () => {
    for (const email of [{ $gt: "" }, { $ne: null }, ["a@b.com"]]) {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { email, password: "StrongPass1!" },
      });

      assert.equal(res.statusCode, 400, `email ${JSON.stringify(email)} must 400`);
    }
  });
});

describe("security headers & CORS", () => {
  it("sends helmet default headers", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });

    assert.equal(res.headers["x-frame-options"], "SAMEORIGIN");
    assert.equal(res.headers["x-content-type-options"], "nosniff");
    assert.ok(res.headers["x-dns-prefetch-control"]);
  });

  it("reflects the trusted origin with credentials", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "http://localhost:3000" },
    });

    assert.equal(res.headers["access-control-allow-origin"], "http://localhost:3000");
    assert.equal(res.headers["access-control-allow-credentials"], "true");
  });

  it("does not reflect untrusted origins", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "http://evil.example" },
    });

    assert.notEqual(res.headers["access-control-allow-origin"], "http://evil.example");
  });
});

describe("GET /health", () => {
  it("reports ok with environment and resource details", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });

    assert.equal(res.statusCode, 200);

    const body = res.json();

    assert.equal(body.status, "ok");
    assert.equal(body.environment, "test");
    assert.equal(typeof body.timestamp, "string");
    assert.equal(typeof body.cpu.cores, "number");
    assert.equal(typeof body.cpu.usagePercent, "number");
    assert.equal(typeof body.memory.totalMB, "number");
    assert.equal(typeof body.memory.usedMB, "number");
  });
});