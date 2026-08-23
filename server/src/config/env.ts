import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number(),
  HOST: z.string(),
  NODE_ENV: z.enum(["development", "production", "test"]),
  MONGODB_URI: z.url().or(z.string().startsWith("mongodb")),
  COOKIE_SECRET: z.string().min(32),
  // CLOUDINARY
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  // Resend
  RESEND_API_KEY: z.string(),
  // Redis
  REDIS_URL: z.url().or(z.string().startsWith("redis")),
});

export const ENV = envSchema.parse(process.env);
