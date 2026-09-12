import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requireVerifiedEmail } from "../../middleware/auth.middleware.js";

import {
  completeUploadParamsSchema,
  fileIdParamsSchema,
  getUploadPresignedUrlSchema,
  renameFileNameSchema,
} from "../../schemas/file.schema.js";
import {
  abortFileUploadHandler,
  completeFileUploadHandler,
  deleteFilePermanentlyHandler,
  emptyTrashHandler,
  getFileDownloadHandler,
  getFilePreviewHandler,
  getTrashedFilesHandler,
  getUploadPresignedUrlHandler,
  renameFileHandler,
  restoreFileHandler,
  trashFileHandler,
} from "../../controllers/file.controller.js";

const fileRoutes: FastifyPluginAsyncZod = async (app) => {
  // Get presigned Url for File Upload (initial)
  app.post(
    "/upload",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        body: getUploadPresignedUrlSchema,
      },
    },
    getUploadPresignedUrlHandler,
  );
  app.post(
    "/upload/:fileId/complete",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        params: completeUploadParamsSchema,
      },
    },
    completeFileUploadHandler,
  );
  // Abort an in-flight Upload (deletes the partial S3 object)
  app.post(
    "/upload/:fileId/abort",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        params: fileIdParamsSchema,
      },
    },
    abortFileUploadHandler,
  );
  // Trashed Files listing + Empty Trash (static paths ahead of /:fileId)
  app.get(
    "/trashed",
    {
      preHandler: requireVerifiedEmail,
    },
    getTrashedFilesHandler,
  );
  app.delete(
    "/trashed",
    {
      preHandler: requireVerifiedEmail,
    },
    emptyTrashHandler,
  );
  // Move a File to Trash (soft delete)
  app.post(
    "/:fileId/trash",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        params: fileIdParamsSchema,
      },
    },
    trashFileHandler,
  );
  // Restore a File from Trash
  app.post(
    "/:fileId/restore",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        params: fileIdParamsSchema,
      },
    },
    restoreFileHandler,
  );
  // Permanently delete a File (only allowed from Trash)
  app.delete(
    "/:fileId/permanent",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        params: fileIdParamsSchema,
      },
    },
    deleteFilePermanentlyHandler,
  );
  // Preview File Content (inline presigned link)
  app.get(
    "/:fileId",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        params: fileIdParamsSchema,
      },
    },
    getFilePreviewHandler,
  );
  app.get(
    "/:fileId/preview",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        params: fileIdParamsSchema,
      },
    },
    getFilePreviewHandler,
  );
  // Download File Content (attachment presigned link)
  app.get(
    "/:fileId/download",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        params: fileIdParamsSchema,
      },
    },
    getFileDownloadHandler,
  );
  // Rename a File (name only, extension preserved)
  app.patch(
    "/:fileId/name",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        params: fileIdParamsSchema,
        body: renameFileNameSchema,
      },
    },
    renameFileHandler,
  );
};

export default fileRoutes;
