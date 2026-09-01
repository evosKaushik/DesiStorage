import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  // App configuration
  PORT: z.coerce.number(),
  HOST: z.string(),
  NODE_ENV: z.enum(["development", "production", "test"]),
  
  // Mongodb
  MONGODB_URI: z.url().or(z.string().startsWith("mongodb")),
  // Redis
  REDIS_URL: z.url().or(z.string().startsWith("redis")),
  // Cookie Secret
  COOKIE_SECRET: z.string().min(32),
  // CLOUDINARY
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  // Resend
  RESEND_API_KEY: z.string(),

  // Google OAuth Credentials
  GOOGLE_CLIENT_ID: z.string().endsWith(".apps.googleusercontent.com", "Invalid Google Client ID"),
});

export const ENV = envSchema.parse(process.env);
