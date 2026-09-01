import type { FastifyInstance } from "fastify";
import { buildApp } from "../../src/app.js";

/**
 * Builds a fully-wired Fastify instance WITHOUT the mongoose plugin.
 * Tests manage their own isolated mongo (tests/setup/db.ts).
 */
export const createTestApp = (): Promise<FastifyInstance> =>
  buildApp({ database: false, logger: false });