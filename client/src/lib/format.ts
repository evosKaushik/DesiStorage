const UNITS = ["B", "KB", "MB", "GB", "TB"];

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    UNITS.length - 1,
  );

  const value = bytes / 1024 ** i;

  return `${value.toFixed(i === 0 || value >= 10 ? 0 : 1)} ${UNITS[i]}`;
}