import { objectIdSchema } from "./folder.schema.js";
import z from "zod";

/**
 * Query params for single-item Trash operations
 * (e.g. `POST /trash?fileId=...` or `POST /trash/restore?folderId=...`).
 */
export const itemQuerySchema = z
  .object({
    fileId: objectIdSchema.optional(),
    folderId: objectIdSchema.optional(),
  })
  .refine((data) => Boolean(data.fileId) !== Boolean(data.folderId), {
    message: "Exactly one of fileId or folderId is required",
  });

/**
 * Bulk Trash / Restore body. Accepts multiple file and folder ids at once;
 * a folder is trashed/restored together with its entire subtree.
 */
export const trashBulkSchema = z
  .object({
    fileIds: z
      .array(objectIdSchema)
      .max(100, "Cannot process more than 100 items at once")
      .optional()
      .default([]),
    folderIds: z
      .array(objectIdSchema)
      .max(100, "Cannot process more than 100 items at once")
      .optional()
      .default([]),
  })
  .refine((body) => body.fileIds.length > 0 || body.folderIds.length > 0, {
    message: "Provide at least one fileId or folderId",
  });

export type ItemQueryParams = z.infer<typeof itemQuerySchema>;

export type TrashBulkBody = z.infer<typeof trashBulkSchema>;

/**
 * Query params for the permanent-delete route. The `action` decides whether
 * a single file (`file`), multiple items (`multiple`), or the whole Trash
 * (`empty`) is permanently removed. The item ids (if any) travel in the body.
 */
export const permanentDeleteQuerySchema = z.object({
  action: z.enum(["file", "multiple", "empty"]),
});

/**
 * Body for the permanent-delete route. Only populated for `action=file` or
 * `action=multiple`; `action=empty` sends no body (and no ids needed).
 */
export const permanentDeleteBodySchema = z
  .object({
    itemIds: z
      .array(objectIdSchema)
      .max(100, "Cannot process more than 100 items at once")
      .optional()
      .default([]),
  })
  .nullish();

export type PermanentDeleteQueryParams = z.infer<
  typeof permanentDeleteQuerySchema
>;

export type PermanentDeleteBody = z.infer<typeof permanentDeleteBodySchema>;