import type { FastifyRequest } from "fastify";
import { isValidObjectId } from "mongoose";
import Session from "../models/session.model.js";
import { ApiError } from "./ApiError.js";
import { redisClient } from "../config/redis.js";
import {
  getUserProfileCacheKey,
  getUserSessionCacheKey,
} from "./cacheKeys.js";
import type { AuthUser } from "../types/fastify.js";

export const requireAuthUser = (req: FastifyRequest): AuthUser => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  return req.user;
};

export const createSessionForUser = async (
  userId: string,
): Promise<{ _id: { toString(): string } }> => {
  return Session.create({ userId });
};

export const resolveVerifiedSessionId = (req: FastifyRequest): string => {
  const rawCookie = req.cookies.sid;

  if (!rawCookie) {
    throw new ApiError(401, "Unauthorized");
  }

  const { valid, value } = req.unsignCookie(rawCookie);

  if (!valid) {
    throw new ApiError(401, "Invalid session");
  }

  const [sessionId] = value.split(".");

  if (!sessionId || !isValidObjectId(sessionId)) {
    throw new ApiError(401, "Invalid session");
  }

  return sessionId;
};

export const revokeSessionById = async (
  sessionId: string,
  userId?: string,
): Promise<void> => {
  await Session.findByIdAndDelete(sessionId);

  const cacheKeys = [getUserSessionCacheKey(sessionId)];

  if (userId) {
    cacheKeys.push(getUserProfileCacheKey(userId));
  }

  await redisClient.del(cacheKeys);
};

export const revokeAllOtherSessions = async (
  userId: string,
  currentSessionId?: string,
): Promise<void> => {
  const sessions = await Session.find({
    userId,
    ...(currentSessionId ? { _id: { $ne: currentSessionId } } : {}),
  })
    .select("_id")
    .lean();

  if (sessions.length === 0) {
    return;
  }

  await Session.deleteMany({
    _id: { $in: sessions.map((session) => session._id) },
  });

  await redisClient.del(
    sessions.map((session) =>
      getUserSessionCacheKey(session._id.toString()),
    ),
  );
};
