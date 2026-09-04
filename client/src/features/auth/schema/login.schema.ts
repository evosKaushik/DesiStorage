import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain one uppercase letter")
  .regex(/[a-z]/, "Password must contain one lowercase letter")
  .regex(/[0-9]/, "Password must contain one number")
  .regex(
    /[!-/:-@[-`{-~]/,
    "Password must contain at least one special character",
  );

export const loginSchema = z.object({
  email: z
    .email("Invalid email address")
    .trim()
    .transform((email) => email.toLowerCase()),

  password: passwordSchema,
  isRememberMe: z.boolean(),
});

export const googleLoginSchema = z.object({
  idToken: z
    .string()
    .regex(
      /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
      "Invalid Google ID token",
    ),
  clientId: z
    .string()
    .min(1, "Client ID is required")
    .endsWith(".apps.googleusercontent.com", "Invalid Google Client ID"),
});

export type GoogleLoginSchema = z.infer<typeof googleLoginSchema>;

export type LoginSchema = z.infer<typeof loginSchema>;
