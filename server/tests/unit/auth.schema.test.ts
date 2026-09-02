import "../setup/env.js";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  forgotPasswordParamsSchema,
  googleLoginSchema,
  loginUserSchema,
  registerUserSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyResetPasswordQuerySchema,
} from "../../src/schemas/auth.schema.js";

const PASSWORD = "StrongPass1!";

describe("auth schemas", () => {
  describe("registerUserSchema", () => {
    it("accepts a valid payload and lowercases the email", () => {
      const result = registerUserSchema.parse({
        fullName: "Rohan Sharma",
        email: "Rohan.Sharma@Example.COM",
        password: PASSWORD,
      });

      assert.equal(result.email, "rohan.sharma@example.com");
    });

    it("rejects invalid emails", () => {
      assert.throws(() =>
        registerUserSchema.parse({
          fullName: "Rohan Sharma",
          email: "not-an-email",
          password: PASSWORD,
        }),
      );
    });

    it("rejects fullName shorter than 2 chars or longer than 100", () => {
      assert.throws(() =>
        registerUserSchema.parse({ fullName: "A", email: "a@b.com", password: PASSWORD }),
      );
      assert.throws(() =>
        registerUserSchema.parse({
          fullName: "A".repeat(101),
          email: "a@b.com",
          password: PASSWORD,
        }),
      );
    });

    it("rejects fullName with characters other than letters/spaces", () => {
      assert.throws(() =>
        registerUserSchema.parse({
          fullName: "Rohan@Sharma",
          email: "a@b.com",
          password: PASSWORD,
        }),
      );
      assert.throws(() =>
        registerUserSchema.parse({
          fullName: "कौशिक राजपूत",
          email: "a@b.com",
          password: PASSWORD,
        }),
      );
    });

    it("rejects weak passwords", () => {
      const base = { fullName: "Rohan Sharma", email: "a@b.com" };

      assert.throws(() => registerUserSchema.parse({ ...base, password: "short" }));
      assert.throws(() =>
        registerUserSchema.parse({ ...base, password: "nouppercase1!" }),
      );
      assert.throws(() =>
        registerUserSchema.parse({ ...base, password: "NOLOWERCASE1!" }),
      );
      assert.throws(() => registerUserSchema.parse({ ...base, password: "NoNumbers!" }));
      assert.throws(() => registerUserSchema.parse({ ...base, password: "NoSymbols123" }));
    });
  });

  describe("loginUserSchema", () => {
    it("accepts the same password rules and trims/lowercases email", () => {
      const result = loginUserSchema.parse({ email: " A@B.com ".trim(), password: PASSWORD });

      assert.equal(result.email, "a@b.com");
    });

    it("rejects a missing special character", () => {
      assert.throws(() => loginUserSchema.parse({ email: "a@b.com", password: "NoSpecial123" }));
    });
  });

  describe("verifyEmailSchema", () => {
    it("accepts exactly 6 digits", () => {
      assert.equal(verifyEmailSchema.parse({ otp: "123456" }).otp, "123456");
    });

    it("rejects non-6-digit or non-numeric OTPs", () => {
      assert.throws(() => verifyEmailSchema.parse({ otp: "12345" }));
      assert.throws(() => verifyEmailSchema.parse({ otp: "1234567" }));
      assert.throws(() => verifyEmailSchema.parse({ otp: "abc456" }));
    });
  });

  describe("forgotPasswordParamsSchema", () => {
    it("lowercases the email param", () => {
      assert.equal(forgotPasswordParamsSchema.parse({ email: "A.B@X.com" }).email, "a.b@x.com");
    });

    it("notes the schema validates email before trimming", () => {
      // z.email() runs on the raw value, so surrounding whitespace is rejected.
      assert.throws(() => forgotPasswordParamsSchema.parse({ email: " A@B.com " }));
    });

    it("rejects invalid email params", () => {
      assert.throws(() => forgotPasswordParamsSchema.parse({ email: "not-an-email" }));
    });
  });

  describe("verifyResetPasswordQuerySchema", () => {
    it("accepts a long token", () => {
      const token = "x".repeat(40);
      assert.equal(verifyResetPasswordQuerySchema.parse({ token }).token, token);
    });

    it("rejects tokens shorter than 20 chars", () => {
      assert.throws(() => verifyResetPasswordQuerySchema.parse({ token: "short-token" }));
    });
  });

  describe("resetPasswordSchema", () => {
    it("accepts a valid token + password", () => {
      const result = resetPasswordSchema.parse({ token: "x".repeat(40), newPassword: PASSWORD });

      assert.equal(result.newPassword, PASSWORD);
    });

    it("rejects a weak new password", () => {
      assert.throws(() =>
        resetPasswordSchema.parse({ token: "x".repeat(40), newPassword: "weakpass" }),
      );
    });
  });

  describe("googleLoginSchema", () => {
    const valid = {
      idToken: "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ4In0.SflKxwRJSMeK",
      clientId: "123456.apps.googleusercontent.com",
    };

    it("accepts a JWT-shaped idToken and a *.apps.googleusercontent.com clientId", () => {
      const result = googleLoginSchema.parse(valid);
      assert.equal(result.idToken, valid.idToken);
    });

    it("rejects a malformed idToken", () => {
      assert.throws(() => googleLoginSchema.parse({ ...valid, idToken: "no-dots-or-sig" }));
      assert.throws(() => googleLoginSchema.parse({ ...valid, idToken: "a.b.c.d" }));
    });

    it("rejects an invalid clientId", () => {
      assert.throws(() =>
        googleLoginSchema.parse({ ...valid, clientId: "not-a-google-client" }),
      );
    });
  });
});