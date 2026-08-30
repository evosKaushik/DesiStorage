import type { FastifyRequest } from "fastify";
import { isValidObjectId } from "mongoose";
import mongoose from "mongoose";
import Session, { type ISession } from "../models/session.model.js";
import { ApiError } from "./ApiError.js";
import { redisClient } from "../config/redis.js";
import {
  getSessionActivityCacheKey,
  getUserProfileCacheKey,
  getUserSessionCacheKey,
} from "./cacheKeys.js";
import type { AuthUser } from "../types/fastify.js";

type ObjectId = mongoose.Types.ObjectId;

export const requireAuthUser = (req: FastifyRequest): AuthUser => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  return req.user;
};

export type LeanSession = ISession & { _id: ObjectId };

export const createSessionForUser = async (
  sessionFields: Omit<ISession, "lastActiveAt" | "createdAt">,
): Promise<{ _id: { toString(): string } }> => {
  return Session.create({ ...sessionFields });
};

export const resolveVerifiedSessionId = (req: FastifyRequest): string => {
  const sessionId = resolveOptionalSessionId(req);

  if (!sessionId) {
    throw new ApiError(401, "Unauthorized");
  }

  return sessionId;
};

export const resolveOptionalSessionId = (req: FastifyRequest): string | null => {
  const rawCookie = req.cookies.sid;

  if (!rawCookie) {
    return null;
  }

  const { valid, value } = req.unsignCookie(rawCookie);

  if (!valid || !value) {
    return null;
  }

  const [sessionId] = value.split(".");

  if (!sessionId || !isValidObjectId(sessionId)) {
    return null;
  }

  return sessionId;
};

export const getSessionsByUserId = async (
  userId: ObjectId | string,
): Promise<LeanSession[]> => {
  return Session.find({ userId }).sort({ lastActiveAt: -1 }).select("-createdAt -updatedAt -__v -userId").lean();
};

export const clearSessionCacheKeys = async (
  sessionId: string,
  userId?: string,
): Promise<void> => {
  const cacheKeys = [
    getUserSessionCacheKey(sessionId),
    getSessionActivityCacheKey(sessionId),
  ];

  if (userId) {
    cacheKeys.push(getUserProfileCacheKey(userId));
  }

  await redisClient.del(cacheKeys);
};

export const revokeSessionById = async (
  sessionId: string,
  userId?: string,
): Promise<void> => {
  await Session.findByIdAndDelete(sessionId);

  await clearSessionCacheKeys(sessionId, userId);
};

export const revokeSessionByOwner = async (
  sessionId: string,
  userId: ObjectId | string,
): Promise<void> => {
  const session = await Session.findById(sessionId).select("_id userId").lean();

  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  if (session.userId.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only revoke your own sessions");
  }

  await Session.findByIdAndDelete(sessionId);

  await clearSessionCacheKeys(sessionId, userId.toString());
};

export const revokeAllOtherSessions = async (
  userId: ObjectId | string,
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

  const sessionIdList = sessions.map((session) => session._id.toString());

  await redisClient.del(
    sessionIdList.flatMap((id) => [
      getUserSessionCacheKey(id),
      getSessionActivityCacheKey(id),
    ]),
  );
};
