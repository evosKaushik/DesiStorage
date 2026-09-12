import mime from "mime-types";

/** Maps a file extension (e.g. ".pdf") to its MIME type via the mime-types library. */
export function mimeTypeFromExtension(extension: string): string {
  return mime.lookup(extension) || "application/octet-stream";
}