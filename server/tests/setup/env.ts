// MUST be the first import in every test file.
//
// In ESM, imports are evaluated depth-first in declaration order, so setting
// process.env here guarantees the values are present before `src/config/env.ts`
// (which z.parse()es at import time, and also runs `dotenv/config`) is loaded.
// `dotenv/config` never overrides values already present on process.env.

const testEnv: Record<string, string> = {
  PORT: "0",
  HOST: "127.0.0.1",
  NODE_ENV: "test",
  FRONTEND_URL: "http://localhost:3000",
  MONGODB_URI: "mongodb://127.0.0.1:27017/desistorage-test",
  REDIS_URL: "redis://localhost:6379",
  COOKIE_SECRET: "test-cookie-secret-0123456789abcdefghijklmnopqrstuv",
  RESET_PASSWORD_SECRET: "test-reset-secret-0123456789abcdefghijklmnopqrstuv",
  CLOUDINARY_CLOUD_NAME: "test-cloud",
  CLOUDINARY_API_KEY: "test-key",
  CLOUDINARY_API_SECRET: "test-secret",
  RESEND_API_KEY: "re_test_0000000000000000",
  GOOGLE_CLIENT_ID: "test-client-id.apps.googleusercontent.com",
  BCRYPT_SALT_ROUNDS: "4",
};

for (const [key, value] of Object.entries(testEnv)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}