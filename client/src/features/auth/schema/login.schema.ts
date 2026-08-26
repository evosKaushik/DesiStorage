import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .email("Invalid email address")
    .trim()
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(/[A-Z]/, "Password must contain one uppercase letter")
    .regex(/[a-z]/, "Password must contain one lowercase letter")
    .regex(/[0-9]/, "Password must contain one number")
    .regex(
      /[!-/:-@[-`{-~]/,
      "Password must contain at least one special character",
    ),
});



export type LoginSchema = z.infer<typeof loginSchema>;
