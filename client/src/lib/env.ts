import { z } from "zod";

// Read each variable DIRECTLY so Next.js can statically inline the
// NEXT_PUBLIC_* values into the client bundle. Do NOT pass the whole
// `process.env` object to a parser — at runtime (in the browser) that object
// has no properties, so every field would come back `undefined` and the
// schema parse would throw a ZodError.
const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url("NEXT_PUBLIC_API_URL must be a valid URL"),

  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_GOOGLE_CLIENT_ID is required")
    .endsWith(".apps.googleusercontent.com", "Invalid Google Client ID"),
});

const envInput = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
};

const parsed = envSchema.safeParse(envInput);

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")}`,
  );
}

export const ENV = parsed.data;
