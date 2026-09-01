import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer: MongoMemoryServer | undefined;

/**
 * Starts an isolated in-memory MongoDB and connects Mongoose to it.
 * Call once in the top-level `before()` of every integration test file.
 */
export async function connectTestDb(): Promise<void> {
  await mongoose.disconnect();
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await syncIndexes();
}

/**
 * Drops all collections and rebuilds indexes so each test starts clean.
 * The unique indexes (email, sparse googleId) must exist before tests that
 * rely on duplicate-key errors.
 */
export async function resetTestDb(): Promise<void> {
  if (!mongoose.connection.db) return;

  await mongoose.connection.db.dropDatabase();
  await syncIndexes();
}

export async function closeTestDb(): Promise<void> {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = undefined;
  }
}

async function syncIndexes(): Promise<void> {
  const models = Object.values(mongoose.models);

  if (models.length === 0) return;

  // syncIndexes() (unlike Model.init()) actually re-creates indexes after the
  // database has been dropped: init() caches that indexes were already built.
  await Promise.all(models.map((model) => model.syncIndexes()));
}