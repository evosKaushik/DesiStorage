import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CompleteUploadParams,
  FileIdParams,
  RenameFileNameBody,
  UploadFilePartsParams,
  UploadRequestBody,
} from "../schemas/file.schema.js";
import { requireAuthUser } from "../utils/session.js";
import {
  abortFileUpload,
  completeFileUpload,
  getFilePresignedAccess,
  getPartUploadUrls,
  renameFile,
  uploadFiles,
} from "../services/file.service.js";

const uploadFilesHandler = async (
  req: FastifyRequest<{ Body: UploadRequestBody }>,
  reply: FastifyReply,
) => {
  const { id, storageLimit, storageUsed } = requireAuthUser(req);

  const data = await uploadFiles({
    ...req.body,
    user: {
      id,
      storageLimit,
      storageUsed,
    },
  });

  reply.success(200, "Presigned URL generated successfully", data);
};

const partUploadUrlsHandler = async (
  req: FastifyRequest<{ Params: UploadFilePartsParams }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  const data = await getPartUploadUrls({
    userId: authUser.id,
    uploadId: req.params.uploadId,
  });

  reply.success(200, "Part upload URLs generated successfully", data);
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
  uploadFilesHandler,
  completeFileUploadHandler,
  getFilePreviewHandler,
  getFileDownloadHandler,
  renameFileHandler,
  abortFileUploadHandler,
  partUploadUrlsHandler,
};
