import User from "../models/user.model.js";
import type {
  RegisterUserBody,
  LoginUserBody,
} from "../schemas/auth.schema.js";
import { ApiError } from "../utils/ApiError.js";
import { sendEmail } from "../utils/email.js";
import Session from "../models/session.model.js";
import { isValidObjectId } from "mongoose";
import {
  DEFAULT_AVATAR,
  MAX_SESSIONS,
  RESET_PASSWORD_TTL_SECONDS,
} from "../constants/constant.js";
import {
  buildPasswordResetToken,
  createHmacHash,
  generatePasswordResetToken,
  parsePasswordResetToken,
} from "../utils/hash.js";
import { ENV } from "../config/env.js";
import { redisClient } from "../config/redis.js";
import { revokeAllOtherSessions } from "../utils/session.js";
import { passwordResetRedisKey } from "../utils/cacheKeys.js";
import { verifyIdToken } from "../utils/googleAuth.js";

const PASSWORD_RESET_COOLDOWN_TTL_SECONDS = RESET_PASSWORD_TTL_SECONDS;

const createUser = async ({ fullName, email, password }: RegisterUserBody) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "Email already exists");
  }

  const newUser = await User.create({
    fullName,
    email,
    password,
    authProviders: ["local"],
  });

  return newUser;
};

const loginUser = async ({ email, password }: LoginUserBody) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isValidPassword = await user.comparePassword(password);

  if (!isValidPassword) {
    throw new ApiError(401, "Invalid email or password");
  }

  const sessionCount = await Session.countDocuments({ userId: user._id });

  if (sessionCount >= MAX_SESSIONS) {
    throw new ApiError(
      429,
      `You have reached the maximum of ${MAX_SESSIONS} active sessions. Please log out of an existing device first.`,
    );
  }

  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    authProviders: user.authProviders,
    avatar: user.avatar,
    storageLimit: user.storageLimit,
    storageUsed: user.storageUsed,
  };
};

const getUserDetails = async (userId: string) => {
  const user = await User.findById(userId).select("-__v").lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

/*
GET OTP & USERID FROM BODY
*/
const sendOTPToEmail = async (email: string, otp: string, username: string) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DesiStorage OTP</title>
</head>

<body style="margin:0;padding:0;background:#020817;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#020817;padding:40px 20px;">
<tr>
<td align="center">

<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#081121;border:1px solid #16213a;border-radius:20px;overflow:hidden;">
<tr>
<td style="padding:32px 36px;">

<div style="font-size:28px;font-weight:bold;color:#60A5FA;">
☁ DesiStorage
</div>

<div style="margin-top:22px;display:inline-block;padding:8px 16px;background:#0F172A;border:1px solid #1E293B;border-radius:999px;font-size:13px;color:#93C5FD;">
Secure Sign-in
</div>

<h1 style="margin:28px 0 14px;font-size:36px;line-height:44px;color:#ffffff;">
Enter your email OTP
</h1>

<p style="margin:0;font-size:17px;line-height:28px;color:#94A3B8;">
Hi <strong style="color:#ffffff;">${username}</strong>,
</p>

<p style="margin:16px 0;font-size:17px;line-height:28px;color:#94A3B8;">
Use the one-time password below to verify your email
<strong style="color:#ffffff;">${email}</strong>.
This code expires in <strong style="color:#ffffff;">5 minutes</strong>.
</p>

<table role="presentation" align="center" cellspacing="8" cellpadding="0" style="margin:30px auto;">
<tr>
<td style="width:56px;height:64px;background:#020817;border:1px solid #2563EB;border-radius:12px;text-align:center;font-size:30px;font-weight:bold;color:#60A5FA;">${otp[0]}</td>
<td style="width:56px;height:64px;background:#020817;border:1px solid #2563EB;border-radius:12px;text-align:center;font-size:30px;font-weight:bold;color:#60A5FA;">${otp[1]}</td>
<td style="width:56px;height:64px;background:#020817;border:1px solid #2563EB;border-radius:12px;text-align:center;font-size:30px;font-weight:bold;color:#60A5FA;">${otp[2]}</td>
<td style="width:56px;height:64px;background:#020817;border:1px solid #2563EB;border-radius:12px;text-align:center;font-size:30px;font-weight:bold;color:#60A5FA;">${otp[3]}</td>
<td style="width:56px;height:64px;background:#020817;border:1px solid #2563EB;border-radius:12px;text-align:center;font-size:30px;font-weight:bold;color:#60A5FA;">${otp[4]}</td>
<td style="width:56px;height:64px;background:#020817;border:1px solid #2563EB;border-radius:12px;text-align:center;font-size:30px;font-weight:bold;color:#60A5FA;">${otp[5]}</td>
</tr>
</table>

<p style="text-align:center;font-size:15px;color:#94A3B8;">
Or copy this code:
</p>

<div style="text-align:center;margin:18px 0 30px;">
<span style="display:inline-block;padding:14px 26px;background:#0F172A;border:1px dashed #3B82F6;border-radius:12px;font-size:28px;font-weight:bold;letter-spacing:8px;color:#60A5FA;">
${otp}
</span>
</div>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#06101F;border:1px solid #16213A;border-radius:16px;">
<tr>
<td style="padding:22px;">
<div style="font-size:16px;font-weight:bold;color:#ffffff;">
🔒 Security reminder
</div>

<div style="margin-top:8px;font-size:14px;line-height:24px;color:#94A3B8;">
Never share this OTP with anyone. DesiStorage will never ask for your verification code.
</div>

</td>
</tr>
</table>

<hr style="border:none;border-top:1px solid #16213A;margin:34px 0;">

<p style="font-size:14px;color:#64748B;text-align:center;">
Didn't request this sign-in? You can safely ignore this email.
</p>

<p style="font-size:13px;color:#475569;text-align:center;">
© 2026 DesiStorage • Secure cloud storage built for Bharat.
</p>

</td>
</tr>
</table>

</td>
</tr>
</table>

</body>
</html>
`;
  try {
    await sendEmail(email, "Your DesiStorage OTP", html);
  } catch (error) {
    throw new Error("Failed to send OTP email");
  }
};

const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email }).select("_id fullName").lean();

  if (!user) {
    return;
  }

  const userId = user._id.toString();

  const cooldownKey = `password-reset:cooldown:${userId}`;

  const cooldownCreated = await redisClient.set(cooldownKey, "1", {
    NX: true,
    EX: PASSWORD_RESET_COOLDOWN_TTL_SECONDS,
  });

  if (!cooldownCreated) {
    throw new ApiError(
      429,
      "A password reset link has already been sent. Please check your email.",
    );
  }

  const random = generatePasswordResetToken();

  const resetToken = buildPasswordResetToken(userId, random);

  const resetTokenKey = passwordResetRedisKey(random);

  await redisClient.set(resetTokenKey, userId, {
    EX: RESET_PASSWORD_TTL_SECONDS,
  });

  const resetUrl = `${ENV.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DesiStorage Password Reset</title>
</head>

<body style="margin:0;padding:0;background:#020817;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">

<table
  role="presentation"
  width="100%"
  cellspacing="0"
  cellpadding="0"
  style="background:#020817;padding:40px 20px;"
>
  <tr>
    <td align="center">

      <table
        role="presentation"
        width="600"
        cellspacing="0"
        cellpadding="0"
        style="background:#081121;border:1px solid #16213a;border-radius:20px;overflow:hidden;"
      >
        <tr>
          <td style="padding:32px 36px;">

            <!-- Logo -->
            <div style="font-size:28px;font-weight:bold;color:#60A5FA;">
              ☁ DesiStorage
            </div>

            <!-- Badge -->
            <div
              style="margin-top:22px;display:inline-block;padding:8px 16px;background:#0F172A;border:1px solid #1E293B;border-radius:999px;font-size:13px;color:#93C5FD;"
            >
              Password Reset
            </div>

            <!-- Heading -->
            <h1
              style="margin:28px 0 14px;font-size:36px;line-height:44px;color:#ffffff;"
            >
              Reset your password
            </h1>

            <!-- Greeting -->
            <p
              style="margin:0;font-size:17px;line-height:28px;color:#94A3B8;"
            >
              Hi <strong style="color:#ffffff;">${user.fullName}</strong>,
            </p>

            <!-- Description -->
            <p
              style="margin:16px 0;font-size:17px;line-height:28px;color:#94A3B8;"
            >
              We received a request to reset the password for your
              DesiStorage account associated with
              <strong style="color:#ffffff;">${email}</strong>.
            </p>

            <p
              style="margin:16px 0;font-size:17px;line-height:28px;color:#94A3B8;"
            >
              Click the button below to create a new password.
              This link will expire in
              <strong style="color:#ffffff;">10 minutes</strong>.
            </p>

            <!-- Reset Button -->
            <table
              role="presentation"
              cellspacing="0"
              cellpadding="0"
              align="center"
              style="margin:32px auto;"
            >
              <tr>
                <td
                  align="center"
                  style="border-radius:12px;background:#2563EB;"
                >
                  <a
                    href="${resetUrl}"
                    target="_blank"
                    style="display:inline-block;padding:16px 32px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:12px;"
                  >
                    Reset Password
                  </a>
                </td>
              </tr>
            </table>

            <!-- Fallback URL -->
            <p
              style="text-align:center;font-size:14px;line-height:22px;color:#64748B;margin:0 0 10px;"
            >
              If the button doesn't work, copy and paste this link into your browser:
            </p>

            <div
              style="background:#020817;border:1px solid #16213A;border-radius:12px;padding:14px 16px;text-align:center;word-break:break-all;"
            >
              <a
                href="${resetUrl}"
                style="font-size:13px;line-height:20px;color:#60A5FA;text-decoration:none;"
              >
                ${resetUrl}
              </a>
            </div>

            <!-- Security Reminder -->
            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              style="margin-top:30px;background:#06101F;border:1px solid #16213A;border-radius:16px;"
            >
              <tr>
                <td style="padding:22px;">

                  <div
                    style="font-size:16px;font-weight:bold;color:#ffffff;"
                  >
                    🔒 Security reminder
                  </div>

                  <div
                    style="margin-top:8px;font-size:14px;line-height:24px;color:#94A3B8;"
                  >
                    DesiStorage will never ask for your password or
                    password reset link. Never share this link with anyone.
                  </div>

                </td>
              </tr>
            </table>

            <!-- Divider -->
            <hr
              style="border:none;border-top:1px solid #16213A;margin:34px 0;"
            >

            <!-- Ignore message -->
            <p
              style="font-size:14px;line-height:22px;color:#64748B;text-align:center;"
            >
              Didn't request a password reset?
              You can safely ignore this email.
              Your password will remain unchanged.
            </p>

            <!-- Footer -->
            <p
              style="font-size:13px;color:#475569;text-align:center;"
            >
              © 2026 DesiStorage • Secure cloud storage built for Bharat.
            </p>

          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>

</body>
</html>
`;

  try {
    await sendEmail(email, "Your DesiStorage Password Reset Link", html);
  } catch (error) {
    await redisClient.del([resetTokenKey, cooldownKey]);

    throw new ApiError(
      503,
      "Unable to send password reset email. Please try again later.",
    );
  }
};

const resolveResetToken = async (
  token: string,
): Promise<{ userId: string }> => {
  let payload: { userId: string; random: string };

  try {
    payload = parsePasswordResetToken(token);
  } catch {
    throw new ApiError(400, "Invalid or expired password reset link.");
  }

  if (!isValidObjectId(payload.userId)) {
    throw new ApiError(400, "Invalid or expired password reset link.");
  }

  const resetTokenKey = passwordResetRedisKey(payload.random);

  const storedUserId = await redisClient.getDel(resetTokenKey);

  if (!storedUserId || storedUserId !== payload.userId) {
    throw new ApiError(400, "Invalid or expired password reset link.");
  }

  return { userId: payload.userId };
};

const verifyResetPasswordToken = async (token: string): Promise<void> => {
  await resolveResetToken(token);
};

const resetPassword = async (token: string, newPassword: string) => {
  const { userId } = await resolveResetToken(token);

  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new ApiError(400, "Invalid or expired password reset link.");
  }

  const isSamePassword = await user.comparePassword(newPassword);

  if (isSamePassword) {
    throw new ApiError(
      400,
      "New password must be different from the old password",
    );
  }

  user.password = newPassword;
  await user.save();

  await revokeAllOtherSessions(userId);
};

const googleAuthentication = async (idToken: string) => {
  const userData = await verifyIdToken(idToken);

  if (!userData) {
    throw new ApiError(401, "Invalid Google ID token");
  }

  const { name, email, picture } = userData;

  if (!email) {
    throw new ApiError(401, "Google account email is missing");
  }

  let user = await User.findOne({ email }).lean();

  if (!user) {
    if (!name) {
      throw new ApiError(400, "Google account name is missing");
    }

    user = await User.create({
      fullName: name,
      email,
      avatar: picture ?? DEFAULT_AVATAR,
      authProviders: ["google"],
    });
  }
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    authProviders: user.authProviders,
    avatar: user.avatar,
    storageLimit: user.storageLimit,
    storageUsed: user.storageUsed,
  };
};

export {
  createUser,
  loginUser,
  getUserDetails,
  sendOTPToEmail,
  forgotPassword,
  verifyResetPasswordToken,
  resetPassword,
  googleAuthentication,
};
