import { formatBytes } from "@/lib/format";

export function getStorageDetails(
  storageUsed?: number,
  storageLimit?: number,
) {
  if (
    typeof storageLimit === "undefined" ||
    typeof storageUsed === "undefined"
  ) {
    return {
      percentageUsed: 0,
      formattedStorageLimit: "0 B",
      formattedStorageUsed: "0 B",
    };
  }

  const percentageUsed = Math.round((storageUsed / storageLimit) * 100);

  return {
    percentageUsed,
    formattedStorageLimit: formatBytes(storageLimit),
    formattedStorageUsed: formatBytes(storageUsed),
  };
}