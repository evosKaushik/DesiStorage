import {
  MAX_PARTS,
  MB,
  MIN_PART_SIZE,
  SIMPLE_UPLOAD_MAX_SIZE,
} from "../constants/constant.js";

export function getMultipartPartSize(fileSize: number) {
  const requiredPartSize = Math.ceil(fileSize / MAX_PARTS);

  const roundedPartSize = Math.ceil(requiredPartSize / MB) * MB;

  return Math.max(MIN_PART_SIZE, roundedPartSize);
}

export function getUploadStrategy(fileSize: number) {
  if (fileSize < SIMPLE_UPLOAD_MAX_SIZE) {
    return {
      strategy: "simple" as const,
      partSize: null,
      totalParts: null,
    };
  }

  const partSize = getMultipartPartSize(fileSize);

  const totalParts = Math.ceil(fileSize / partSize);

  return {
    strategy: "multipart" as const,
    partSize,
    totalParts,
  };
}