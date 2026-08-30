import { z } from "zod";

export const verifyEmailSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

export type VerifyEmailSchema = z.infer<typeof verifyEmailSchema>;
