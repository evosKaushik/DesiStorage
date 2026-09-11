import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CompleteUploadParams,
  FileIdParams,
  GetUploadPresignedUrlBody,
} from "../schemas/file.schema.js";
import { requireAuthUser } from "../utils/session.js";
import {
  completeFileUpload,
  getFilePresignedAccess,
  getUploadPresignedUrl,
} from "../services/file.service.js";

const getUploadPresignedUrlHandler = async (
  req: FastifyRequest<{ Body: GetUploadPresignedUrlBody }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  const data = await getUploadPresignedUrl({
    ...req.body,
    userId: authUser.id,
  });

  reply.success(200, "Presigned URL generated successfully", data);
};

const completeFileUploadHandler = async (
  req: FastifyRequest<{ Params: CompleteUploadParams }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  const file = await completeFileUpload({
    userId: authUser.id,
    fileId: req.params.fileId,
  });

  reply.success(201, "File registered successfully", { file });
};

const getFileAccessHandler =
  (disposition: "inline" | "attachment") =>
  async (
    req: FastifyRequest<{ Params: FileIdParams }>,
    reply: FastifyReply,
  ) => {
    const authUser = requireAuthUser(req);

    const data = await getFilePresignedAccess({
      userId: authUser.id,
      fileId: req.params.fileId,
      disposition,
    });

    reply.success(200, "Presigned file link generated successfully", data);
  };

const getFilePreviewHandler = getFileAccessHandler("inline");
const getFileDownloadHandler = getFileAccessHandler("attachment");

export {
  getUploadPresignedUrlHandler,
  completeFileUploadHandler,
  getFilePreviewHandler,
  getFileDownloadHandler,
};