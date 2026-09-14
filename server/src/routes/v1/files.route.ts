import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requireVerifiedEmail } from "../../middleware/auth.middleware.js";

import {
  completeUploadParamsSchema,
  fileIdParamsSchema,
  uploadRequestSchema,
  renameFileNameSchema,
  uploadFilePartsSchema,
} from "../../schemas/file.schema.js";
import {
  abortFileUploadHandler,
  completeFileUploadHandler,
  getFileDownloadHandler,
  getFilePreviewHandler,
  partUploadUrlsHandler,
  renameFileHandler,
  uploadFilesHandler,
} from "../../controllers/file.controller.js";

const fileRoutes: FastifyPluginAsyncZod = async (app) => {
  // Get presigned Url for File Upload (initial)
  app.post(
    "/upload",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        body: uploadRequestSchema,
      },
    },
    uploadFilesHandler,
  );
  
  // Upload parts
  app.post(
    "/upload/:uploadId/parts",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        params: uploadFilePartsSchema,
      },
    },
    partUploadUrlsHandler,
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
