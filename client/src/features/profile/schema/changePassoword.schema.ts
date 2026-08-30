import z from "zod";

export const changePasswordSchema = z
  .object({
    oldPassword: z
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

    newPassword: z
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
    confirmPassword: z
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
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "New password must be different from old password",
    path: ["newPassword"],
  })
  .refine((data) => data.newPassword !== data.confirmPassword, {
    message: "New password must be same from confirm password",
    path: ["newPassword"],
  });

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
