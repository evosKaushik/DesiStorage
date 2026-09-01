export const ONE_HOUR = 60 * 60;

export const OTP_TTL_SECONDS = 5 * 60; // 5 minutes

export const MAX_SESSIONS = 3;

// Session last-active freshness for redis-backed updates
export const SESSION_ACTIVITY_REDIS_TTL = 60; // 1 minute
export const SESSION_ACTIVITY_DB_WRITE_INTERVAL = 5 * 60 * 1000; // 5 minutes (ms)

export const RESET_PASSWORD_TTL_SECONDS = 10 * 60; // 10 minutes