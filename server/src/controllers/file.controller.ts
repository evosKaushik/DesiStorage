import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CompleteUploadParams,
  FileIdParams,
  GetUploadPresignedUrlBody,
  RenameFileNameBody,
} from "../schemas/file.schema.js";
import { requireAuthUser } from "../utils/session.js";
import {
  abortFileUpload,
  completeFileUpload,
  getFilePresignedAccess,
  getUploadPresignedUrl,
  renameFile,
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

  await completeFileUpload({
    userId: authUser.id,
    fileId: req.params.fileId,
  });

  return reply.code(204).send();
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

const renameFileHandler = async (
  req: FastifyRequest<{ Params: FileIdParams; Body: RenameFileNameBody }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  await renameFile({
    userId: authUser.id,
    fileId: req.params.fileId,
    name: req.body.name,
  });

  return reply.code(204).send();
};

const abortFileUploadHandler = async (
  req: FastifyRequest<{ Params: FileIdParams }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  await abortFileUpload({
    userId: authUser.id,
    fileId: req.params.fileId,
  });

  reply.code(204).send();
};


export {
  getUploadPresignedUrlHandler,
  completeFileUploadHandler,
  getFilePreviewHandler,
  getFileDownloadHandler,
  renameFileHandler,
  abortFileUploadHandler,
};
