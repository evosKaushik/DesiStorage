import { ENV } from "../config/env.js";
import { createHmacHash } from "./hash.js";

export const getUserOtpCacheKey = (userId: string): string =>
  `user:${userId}:otp`;

export const getUserSessionCacheKey = (sessionId: string): string =>
  `user:${sessionId}:session`;

export const getSessionActivityCacheKey = (sessionId: string): string =>
  `session:${sessionId}:lastActive`;

export const getUserProfileCacheKey = (userId: string): string =>
  `user:${userId}`;

export const passwordResetRedisKey = (random: string): string =>
  `password-reset:${createHmacHash(random, ENV.RESET_PASSWORD_SECRET)}`;

export const passwordResetCooldownKey = (userId: string): string =>
  `password-reset:cooldown:${userId}`;
