//   "name": "video",
//   "extension": ".mp4",
//   "size": 104857600,
//   "contentType": "video/mp4",
//   "parentId": null

import z from "zod";
import { objectIdSchema } from "./folder.schema.js";
import {
  fileBaseNameRegex,
  fileExtensionRegex,
  mimeTypeRegex,
  storageNameRegex,
} from "../constants/constant.js";

export const getUploadPresignedUrlSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "File name is required")
    .max(255, "File name cannot exceed 255 characters")
    .regex(
      storageNameRegex,
      'File name cannot contain: \\ / : * ? " < > | and cannot end with a space or period.',
    )
    .regex(
      fileBaseNameRegex,
      "File name cannot contain a dot (provide the extension separately)",
    ),
  extension: z
    .string()
    .trim()
    .max(10, "Extension cannot exceed 10 characters")
    .regex(fileExtensionRegex, "Extension must be like .png or .zip"),
  size: z.number().nonnegative("File size cannot be negative"),
  mimeType: z.string().trim().regex(mimeTypeRegex, "Invalid content type"),
  parentId: objectIdSchema,
});

export const completeUploadParamsSchema = z.object({
  uploadId: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      "Invalid upload ID",
    ),
});

export const fileIdParamsSchema = z.object({
  fileId: objectIdSchema,
});

export type GetUploadPresignedUrlBody = z.infer<
  typeof getUploadPresignedUrlSchema
>;

export type CompleteUploadParams = z.infer<typeof completeUploadParamsSchema>;

export type FileIdParams = z.infer<typeof fileIdParamsSchema>;