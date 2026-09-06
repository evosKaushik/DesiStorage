import { cn } from "@/lib/utils";
import type { FilePreviewType } from "@/store/useFileSystemStore";

/**
 * Renders a file's preview from its blob URL.
 * Returns null when the file type has no visual thumbnail
 * (e.g. audio) so callers can fall back to the kind icon.
 */
export function FilePreview({
  url,
  previewType,
  className,
}: {
  url?: string;
  previewType?: FilePreviewType;
  className?: string;
}) {
  if (!url) return null;

  if (previewType === "image") {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  if (previewType === "video") {
    return (
      <video
        src={url}
        muted
        playsInline
        preload="metadata"
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  if (previewType === "pdf" || previewType === "text") {
    return (
      <iframe
        src={url}
        title="Preview"
        className={cn("h-full w-full", className)}
      />
    );
  }

  return null;
}