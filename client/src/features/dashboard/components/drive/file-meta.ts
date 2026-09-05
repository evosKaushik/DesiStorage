import {
  Folder,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Film,
  Music,
  Archive,
} from "lucide-react";
import { FileKind } from "@/features/dashboard/types/types";

export const FILE_ICONS: Record<FileKind, typeof Folder> = {
  folder: Folder,
  image: ImageIcon,
  sheet: FileSpreadsheet,
  video: Film,
  audio: Music,
  zip: Archive,
  pdf: FileText,
  doc: FileText,
};

export function kindFromMimeType(mimeType: string): FileKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (/^application\/(x-)?pdf$|^application\/x-pdf/.test(mimeType)) return "pdf";
  if (/spreadsheet|ms-excel|\/(\s*)?csv|opendocument\.spreadsheet/.test(mimeType))
    return "sheet";
  if (/zip|compressed|x-tar|gzip|rar|7z/.test(mimeType)) return "zip";
  if (/word|msword|officedocument|^text\//.test(mimeType)) return "doc";
  return "doc";
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const value = bytes / 1024 ** i;

  return `${value.toFixed(i === 0 || value >= 10 ? 0 : 1)} ${units[i]}`;
}

export function colorFor(kind: FileKind) {
  switch (kind) {
    case "image":
      return "text-violet-500 bg-violet-500/10";
    case "sheet":
      return "text-emerald-500 bg-emerald-500/10";
    case "video":
      return "text-rose-500 bg-rose-500/10";
    case "audio":
      return "text-amber-500 bg-amber-500/10";
    case "zip":
      return "text-orange-500 bg-orange-500/10";
    case "pdf":
      return "text-red-500 bg-red-500/10";
    case "doc":
      return "text-blue-500 bg-blue-500/10";
    default:
      return "text-primary bg-primary/10";
  }
}
