function getTimeAgo(date: Date | string): string {
  const givenDate = new Date(date);
  const now = new Date();

  const diffMs = now.getTime() - givenDate.getTime();

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
  }

  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  }

  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }

  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export {getTimeAgo}