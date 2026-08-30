export const getUserOtpCacheKey = (userId: string): string =>
  `user:${userId}:otp`;

export const getUserSessionCacheKey = (sessionId: string): string =>
  `user:${sessionId}:session`;

export const getSessionActivityCacheKey = (sessionId: string): string =>
  `session:${sessionId}:lastActive`;

export const getUserProfileCacheKey = (userId: string): string => `user:${userId}`;
