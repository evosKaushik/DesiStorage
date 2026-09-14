export const ONE_HOUR = 60 * 60;

export const ONE_DAY = 24 * ONE_HOUR;

export const OTP_TTL_SECONDS = 5 * 60; // 5 minutes

export const MAX_SESSIONS = 3;

// Session last-active freshness for redis-backed updates
export const SESSION_ACTIVITY_REDIS_TTL = 60; // 1 minute
export const SESSION_ACTIVITY_DB_WRITE_INTERVAL = 5 * 60 * 1000; // 5 minutes (ms)

export const RESET_PASSWORD_TTL_SECONDS = 10 * 60; // 10 minutes

export const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dvhqwwpdl/image/upload/v1777532041/default-avatar_frnvfo.jpg";

// Folder Or File Name Regex
export const storageNameRegex = /^(?!\.{1,2}$)(?!.*[. ]$)[^\\/:*?"<>|]+$/;

// File Base Name Regex (no extension; extension is stored separately)
export const fileBaseNameRegex = /^[^.]+$/;

// File Extension Regex (.png, .zip, .mp4, ...)
export const fileExtensionRegex = /^\.[a-z0-9]+$/i;

export const mimeTypeRegex =
  /^[a-zA-Z0-9][a-zA-Z0-9!#$&^_.+-]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&^_.+-]*$/;

// Upload Limits
export const SIMPLE_UPLOAD_MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export const MB = 1024 * 1024;

export const MIN_PART_SIZE = 10 * MB;
export const MAX_PARTS = 10_000;
