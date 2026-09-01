import type { TestContext } from "node:test";
import { redisClient } from "../../src/config/redis.js";

export interface FakeRedisClient {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string | number | boolean,
    opts?: { EX?: number; NX?: boolean; PX?: number },
  ): Promise<string | boolean | null>;
  del(keys: string | string[]): Promise<number>;
  getDel(key: string): Promise<string | null>;
  clear(): void;
}

type Entry = { value: string; expiresAt: number | null };

/**
 * Minimal in-memory Redis implementing exactly the subset the server uses:
 * get / set (EX and NX) / del / getDel. TTL is honored on read.
 */
class FakeRedis implements FakeRedisClient {
  private store = new Map<string, Entry>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);

    if (!entry) return null;

    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(
    key: string,
    value: string | number | boolean,
    opts?: { EX?: number; NX?: boolean; PX?: number },
  ): Promise<string | boolean | null> {
    if (opts?.NX) {
      const existing = await this.get(key);

      if (existing !== null) return false;
    }

    const expiresAt =
      opts?.EX !== undefined
        ? Date.now() + opts.EX * 1000
        : opts?.PX !== undefined
          ? Date.now() + opts.PX
          : null;

    this.store.set(key, { value: String(value), expiresAt });

    return opts?.NX ? true : "OK";
  }

  async del(keys: string | string[]): Promise<number> {
    const list = Array.isArray(keys) ? keys : [keys];
    let deleted = 0;

    for (const key of list) {
      if (this.store.delete(key)) deleted++;
    }

    return deleted;
  }

  async getDel(key: string): Promise<string | null> {
    const value = await this.get(key);

    this.store.delete(key);

    return value;
  }

  clear(): void {
    this.store.clear();
  }
}

export const fakeRedis: FakeRedisClient = new FakeRedis();

export function resetRedis(): void {
  fakeRedis.clear();
}

/**
 * wires the app's `redisClient` methods to the in-memory fake using the
 * test context's mock so each test is isolated and auto-restored.
 */
export function mockRedis(t: unknown): void {
  const ctx = t as TestContext;

  ctx.mock.method(redisClient, "get", (key: string) => fakeRedis.get(key));
  ctx.mock.method(
    redisClient,
    "set",
    (key: string, value: unknown, opts?: object) =>
      fakeRedis.set(
        key,
        value as string,
        opts as { EX?: number; NX?: boolean; PX?: number },
      ),
  );
  ctx.mock.method(redisClient, "del", (keys: string | string[]) =>
    fakeRedis.del(keys),
  );
  ctx.mock.method(redisClient, "getDel", (key: string) =>
    fakeRedis.getDel(key),
  );
}