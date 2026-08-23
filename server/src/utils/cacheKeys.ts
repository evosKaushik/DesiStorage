export const getUserOtpCacheKey = (userId: string): string =>
  `user:${userId}:otp`;

export const getUserSessionCacheKey = (sessionId: string): string =>
  `user:${sessionId}:session`;

export const getUserProfileCacheKey = (userId: string): string => `user:${userId}`;
