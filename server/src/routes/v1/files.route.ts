import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { requireVerifiedEmail } from "../../middleware/auth.middleware.js";

import {
  completeUploadParamsSchema,
  fileIdParamsSchema,
  getUploadPresignedUrlSchema,
} from "../../schemas/file.schema.js";
import {
  completeFileUploadHandler,
  getFileDownloadHandler,
  getFilePreviewHandler,
  getUploadPresignedUrlHandler,
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
    "/upload/:uploadId/complete",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        params: completeUploadParamsSchema,
      },
    },
    completeFileUploadHandler,
  );
  // Preview File Content (inline + streamed)
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
  // Download File Content (attachment + streamed)
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
};

export default fileRoutes;