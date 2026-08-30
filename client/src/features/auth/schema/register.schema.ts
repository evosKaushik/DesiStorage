import { z } from "zod";
import { loginSchema } from "./login.schema";

export const registerSchema = loginSchema.extend({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters")
    .regex(/^[A-Za-z]+(?: [A-Za-z]+)*$/, "Only letters and spaces are allowed"),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
