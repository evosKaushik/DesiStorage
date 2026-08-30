import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  ChangePasswordBody,
  LoginUserBody,
  RegisterUserBody,
  VerifyEmailBody,
} from "../schemas/auth.schema.js";
import {
  createUser,
  loginUser,
  sendOTPToEmail,
} from "../services/auth.service.js";
import { setSessionIdCookie, clearSessionIdCookie } from "../utils/cookies.js";
import { ApiError } from "../utils/ApiError.js";
import { redisClient } from "../config/redis.js";
import User from "../models/user.model.js";
import { generateOTP } from "../utils/generateOTP.js";
import { OTP_TTL_SECONDS } from "../constants/constant.js";
import {
  createSessionForUser,
  getSessionsByUserId,
  requireAuthUser,
  resolveOptionalSessionId,
  resolveVerifiedSessionId,
  revokeAllOtherSessions,
  revokeSessionById,
  revokeSessionByOwner,
} from "../utils/session.js";
import {
  getUserOtpCacheKey,
  getUserProfileCacheKey,
} from "../utils/cacheKeys.js";
import { getFormattedUserAgent } from "../utils/UAParser.js";

// Register user
const createUserHandler = async (
  req: FastifyRequest<{ Body: RegisterUserBody }>,
  reply: FastifyReply,
) => {
  const user = await createUser(req.body);

  return reply.success(201, "User created successfully", {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    avatar: user.avatar,
    storageLimit: user.storageLimit,
    storageUsed: user.storageUsed,
  });
};

// Login User
const loginUserHandler = async (
  req: FastifyRequest<{ Body: LoginUserBody }>,
  reply: FastifyReply,
) => {
  const existingSessionId = resolveOptionalSessionId(req);

  if (existingSessionId) {
    throw new ApiError(400, "You are already logged in");
  }

  const user = await loginUser(req.body);

  const userAgent = getFormattedUserAgent(req);

  const userSession = await createSessionForUser({
    userId: user.id,
    ...userAgent,
  });

  setSessionIdCookie(reply, userSession._id.toString());

  return reply.success(200, "User logged in successfully", user);
};

// Get login User
const getUserHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  return reply.success(200, "User fetched successfully", req.user);
};

// Send Verification OTP
const sendVerificationHandler = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const user = requireAuthUser(req);

  if (user.isEmailVerified) {
    throw new ApiError(400, "Your Email is already Verified");
  }

  const { fullName, email, id } = user;
  const otpKey = getUserOtpCacheKey(id);

  const cachedOTP = await redisClient.get(otpKey);

  if (cachedOTP) {
    throw new ApiError(400, "OTP is still valid");
  }

  const OTP = generateOTP(); // Generate only

  await redisClient.set(otpKey, OTP, {
    EX: OTP_TTL_SECONDS,
  });

  try {
    await sendOTPToEmail(email, OTP, fullName);

    req.log.info({
      event: "OTP_SENT",
      userId: id,
    });

    return reply.success(200, "OTP sent successfully", null);
  } catch (error) {
    await redisClient.del(otpKey);

    req.log.error({
      event: "OTP_SEND_FAILED",
      userId: id,
      err: error,
    });

    throw error;
  }
};

// Verify OTP for Email
const verifyEmailHandler = async (
  req: FastifyRequest<{ Body: VerifyEmailBody }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  if (authUser.isEmailVerified) {
    throw new ApiError(400, "Your Email is already Verified");
  }

  const { otp } = req.body;
  const userId = authUser.id;
  const otpKey = getUserOtpCacheKey(userId);

  const storedOTP = await redisClient.get(otpKey);

  if (!storedOTP) {
    throw new ApiError(
      400,
      "OTP expired or not found, please request a new one",
    );
  }

  if (otp !== storedOTP) {
    throw new ApiError(400, "Invalid OTP, Please try again");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { isEmailVerified: true },
    { new: true },
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await redisClient.del([otpKey, getUserProfileCacheKey(userId)]);

  req.log.info({
    event: "EMAIL_VERIFIED",
    userId,
  });

  return reply.success(200, "Verified successfully", null);
};

const changePasswordHandler = async (
  req: FastifyRequest<{ Body: ChangePasswordBody }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(authUser.id).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isValidPassword = await user.comparePassword(oldPassword);

  if (!isValidPassword) {
    throw new ApiError(401, "Invalid current password");
  }

  const currentSessionId = resolveVerifiedSessionId(req);

  user.password = newPassword;
  await user.save();

  // Rotate credentials: kill every other device's session
  await revokeAllOtherSessions(authUser.id, currentSessionId);

  req.log.info({
    event: "PASSWORD_CHANGED",
    userId: authUser.id,
  });

  return reply.success(200, "Password changed successfully", null);
};

// Logout User (current device)
const logoutHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const sessionId = resolveVerifiedSessionId(req);

  await revokeSessionById(sessionId);

  clearSessionIdCookie(reply);

  return reply.success(200, "Logged out successfully", null);
};

// Get all active sessions for the authenticated user
const getAllSessionsHandler = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);
  const currentSessionId = resolveVerifiedSessionId(req);

  const sessions = await getSessionsByUserId(authUser.id);

  const formattedSessions = sessions.map((session) => ({
    id: session._id.toString(),
    device: session.device,
    browserVersion: session.browserVersion,
    operatingSystem: session.operatingSystem,
    ip: session.ip,
    countryCode: session.countryCode,
    state: session.state,
    lastActiveAt: session.lastActiveAt,
    isCurrent: session._id.toString() === currentSessionId,
  }));

  return reply.success(200, "Sessions fetched successfully", formattedSessions);
};

// Logout a specific session (device) owned by the authenticated user
const logoutSessionHandler = async (
  req: FastifyRequest<{ Params: { sessionId: string } }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);
  const { sessionId } = req.params;

  await revokeSessionByOwner(sessionId, authUser.id);

  return reply.success(200, "Session logged out successfully", null);
};

// Logout from all devices (including current)
const logoutAllSessionsHandler = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  await revokeAllOtherSessions(authUser.id);

  clearSessionIdCookie(reply);

  return reply.success(200, "Logged out from all devices", null);
};

export {
  createUserHandler,
  loginUserHandler,
  getUserHandler,
  verifyEmailHandler,
  sendVerificationHandler,
  changePasswordHandler,
  logoutHandler,
  getAllSessionsHandler,
  logoutSessionHandler,
  logoutAllSessionsHandler,
};
