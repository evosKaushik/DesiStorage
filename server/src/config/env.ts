import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number(),
  HOST: z.string(),
  NODE_ENV: z.enum(["development", "production", "test"]),
  MONGODB_URI: z.string().url().or(z.string().startsWith("mongodb")),
});

export const env = envSchema.parse(process.env);
