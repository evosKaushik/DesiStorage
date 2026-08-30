import User from "../models/user.model.js";
import type {
  RegisterUserBody,
  LoginUserBody,
} from "../schemas/auth.schema.js";
import { ApiError } from "../utils/ApiError.js";
import { sendEmail } from "../utils/email.js";
import Session from "../models/session.model.js";
import { MAX_SESSIONS } from "../constants/constant.js";

const createUser = async ({ fullName, email, password }: RegisterUserBody) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "Email already exists");
  }

  const newUser = await User.create({
    fullName,
    email,
    password,
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

export { createUser, loginUser, getUserDetails, sendOTPToEmail };
