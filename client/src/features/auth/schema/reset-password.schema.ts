import { z } from "zod";
import { passwordSchema } from "./login.schema";

export const resetPasswordSchema = z
  .object({
    token: z
      .string("Invalid token")
      .trim()
      .min(20, "Invalid token")
      .max(500, "Invalid token"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
