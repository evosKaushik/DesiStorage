import { z } from "zod";

export const verifyEmailSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});
export const loginUserSchema = z.object({
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
export const registerUserSchema = loginUserSchema.extend({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters")
    .regex(/^[A-Za-z]+(?: [A-Za-z]+)*$/, "Only letters and spaces are allowed"),
});
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
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "New password must be different from old password",
    path: ["newPassword"],
  });

export type RegisterUserBody = z.infer<typeof registerUserSchema>;

export type LoginUserBody = z.infer<typeof loginUserSchema>;

export type VerifyEmailBody = z.infer<typeof verifyEmailSchema>;

export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;
