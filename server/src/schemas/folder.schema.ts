import { Types } from "mongoose";
import { storageNameRegex } from "../constants/constant.js";
import z from "zod";

export const objectIdSchema = z.string().refine(Types.ObjectId.isValid, {
  message: "Invalid MongoDB ObjectId",
});

export const createFolderSchema = z.object({
  parentId: objectIdSchema,

  folderName: z
    .string()
    .trim()
    .min(1, "Folder name is required")
    .max(255, "Folder name cannot exceed 255 characters")
    .regex(
      storageNameRegex,
      'Folder name cannot contain: \\ / : * ? " < > | and cannot end with a space or period.',
    )
    .optional()
    .default("New Folder"),
});

export const folderIdSchema = z.object({
  folderId: objectIdSchema,
});

export const renameFolderNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Folder name is required")
    .max(255, "Folder name cannot exceed 255 characters")
    .regex(
      storageNameRegex,
      'Folder name cannot contain: \\ / : * ? " < > | and cannot end with a space or period.',
    )
});

export type CreateFolderBody = z.infer<typeof createFolderSchema>;

export type FolderIdParams = z.infer<typeof folderIdSchema>;

export type RenameFolderNameBody = z.infer<typeof renameFolderNameSchema>;
