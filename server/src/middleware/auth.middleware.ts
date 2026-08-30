import type { FastifyReply, FastifyRequest } from "fastify";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { redisGetJson, redisSetJson } from "../utils/redis.js";
import type { AuthUser } from "../types/fastify.js";
import Session from "../models/session.model.js";
import { redisClient } from "../config/redis.js";
import {
  ONE_HOUR,
  SESSION_ACTIVITY_DB_WRITE_INTERVAL,
  SESSION_ACTIVITY_REDIS_TTL,
} from "../constants/constant.js";
import {
  getSessionActivityCacheKey,
  getUserProfileCacheKey,
  getUserSessionCacheKey,
} from "../utils/cacheKeys.js";
import { resolveVerifiedSessionId, revokeSessionById } from "../utils/session.js";

type CachedUser = Omit<AuthUser, "id">;

interface SessionActivity {
  lastRedisUpdate: number;
  lastDbWrite: number;
}

const updateSessionActivity = async (sessionId: string): Promise<void> => {
  const now = Date.now();
  const activityKey = getSessionActivityCacheKey(sessionId);

  const cachedActivity = await redisGetJson<SessionActivity>(activityKey);

  const lastRedisUpdate = cachedActivity?.lastRedisUpdate ?? 0;
  const lastDbWrite = cachedActivity?.lastDbWrite ?? 0;

  if (now - lastRedisUpdate < SESSION_ACTIVITY_REDIS_TTL * 1000) {
    return;
  }

  let needsDbWrite = false;

  if (now - lastDbWrite >= SESSION_ACTIVITY_DB_WRITE_INTERVAL) {
    needsDbWrite = true;
  }

  await redisSetJson<SessionActivity>(
    activityKey,
    {
      lastRedisUpdate: now,
      lastDbWrite: needsDbWrite ? now : lastDbWrite,
    },
    ONE_HOUR,
  );

  if (needsDbWrite) {
    await Session.updateOne(
      { _id: sessionId },
      { lastActiveAt: new Date(now) },
    );
  }
};

const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
  const sessionId = resolveVerifiedSessionId(req);

  const sessionKey = getUserSessionCacheKey(sessionId);

  const cachedUserIdSession = await redisClient.get(sessionKey);

  let userId: string = "";

  if (cachedUserIdSession) {
    userId = cachedUserIdSession;
  } else {
    const session = await Session.findById(sessionId).select("userId -_id");

    if (!session) {
      reply.clearCookie("sid", { path: "/" });
      throw new ApiError(401, "Session not found");
    }

    userId = session.userId.toString();
    await redisClient.set(sessionKey, userId, { EX: ONE_HOUR });
  }

  void updateSessionActivity(sessionId);

  const userKey = getUserProfileCacheKey(userId);

  const cachedUser = await redisGetJson<CachedUser>(userKey);

  if (cachedUser) {
    req.user = { id: userId, ...cachedUser };
    return;
  }

  const user = await User.findById(userId)
    .select("email fullName avatar storageLimit storageUsed isEmailVerified")
    .lean();

  if (!user) {
    await revokeSessionById(sessionId, userId);
    reply.clearCookie("sid", { path: "/" });
    throw new ApiError(401, "Unauthorized");
  }

  await redisSetJson<CachedUser>(
    userKey,
    {
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      storageLimit: user.storageLimit,
      storageUsed: user.storageUsed,
      isEmailVerified: user.isEmailVerified,
    },
    ONE_HOUR,
  );

  req.user = {
    id: user._id.toString(),
    email: user.email,
    fullName: user.fullName,
    avatar: user.avatar,
    storageLimit: user.storageLimit,
    storageUsed: user.storageUsed,
    isEmailVerified: user.isEmailVerified,
  };
};

const requireVerifiedEmail = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  await authenticate(req, reply);

  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  if (!req.user.isEmailVerified) {
    throw new ApiError(403, "Email verification required");
  }
};

export { authenticate, requireVerifiedEmail };
