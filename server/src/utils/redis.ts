import { redisClient } from "../config/redis.js";

export const redisGetJson = async <T>(key: string): Promise<T | null> => {
  const value = await redisClient.get(key);

  if (value === null) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const redisSetJson = async <T>(
  key: string,
  value: T,
  ttl?: number,
): Promise<void> => {
  const serialized = JSON.stringify(value);

  if (ttl !== undefined) {
    await redisClient.set(key, serialized, {
      EX: ttl,
    });
    return;
  }

  await redisClient.set(key, serialized);
};

export const redisDelete = async (key: string): Promise<void> => {
  await redisClient.del(key);
};
