import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain one uppercase letter")
    .regex(/\d/, "Password must contain one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain one symbol"),
});

export type LoginSchema = z.infer<typeof loginSchema>;
