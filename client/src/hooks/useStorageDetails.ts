export const formatSize = (bytes = 0): string => {
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (bytes >= GB) return (bytes / GB).toFixed(2) + " GB";
  if (bytes >= MB) return (bytes / MB).toFixed(2) + " MB";
  if (bytes >= KB) return (bytes / KB).toFixed(2) + " KB";
  return bytes + " B";
};
const UseStorageDetails = (storageUsed?: number, storageLimit?: number) => {
  if (
    typeof storageLimit === "undefined" ||
    typeof storageUsed === "undefined"
  ) {
    return {
      percentageUsed: 0,
      formattedStorageLimit: 0,
      formattedStorageUsed: 0,
    };
  }

  const percentageUsed = Math.round((storageUsed / storageLimit) * 100);

  const formattedStorageLimit = formatSize(storageLimit);

  const formattedStorageUsed = formatSize(storageUsed);

  return { percentageUsed, formattedStorageLimit, formattedStorageUsed };
};

export default UseStorageDetails;
