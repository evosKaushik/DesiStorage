import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CompleteUploadParams,
  FileIdParams,
  GetUploadPresignedUrlBody,
  ItemQueryParams,
  RenameFileNameBody,
} from "../schemas/file.schema.js";
import { requireAuthUser } from "../utils/session.js";
import {
  abortFileUpload,
  completeFileUpload,
  deleteFilePermanently,
  emptyTrash,
  getFilePresignedAccess,
  getTrashedFiles,
  getUploadPresignedUrl,
  renameFile,
  restoreFile,
  trashFile,
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

const renameFileHandler = async (
  req: FastifyRequest<{ Params: FileIdParams; Body: RenameFileNameBody }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  const file = await renameFile({
    userId: authUser.id,
    fileId: req.params.fileId,
    name: req.body.name,
  });

  reply.success(200, "File renamed successfully", { file });
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



const restoreFileHandler = async (
  req: FastifyRequest<{ Params: FileIdParams }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  await restoreFile({
    userId: authUser.id,
    fileId: req.params.fileId,
  });

  reply.code(204).send();
};

const deleteFilePermanentlyHandler = async (
  req: FastifyRequest<{ Params: FileIdParams }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  await deleteFilePermanently({
    userId: authUser.id,
    fileId: req.params.fileId,
  });

  reply.code(204).send();
};

const getTrashedFilesHandler = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  const files = await getTrashedFiles({ userId: authUser.id });

  reply.success(200, "Trashed files fetched successfully", { files });
};

const emptyTrashHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const authUser = requireAuthUser(req);

  await emptyTrash({ userId: authUser.id });

  reply.code(204).send();
};

export {
  getUploadPresignedUrlHandler,
  completeFileUploadHandler,
  getFilePreviewHandler,
  getFileDownloadHandler,
  renameFileHandler,
  abortFileUploadHandler,
  restoreFileHandler,
  deleteFilePermanentlyHandler,
  getTrashedFilesHandler,
  emptyTrashHandler,
};
