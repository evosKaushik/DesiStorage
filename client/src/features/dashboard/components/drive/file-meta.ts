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
