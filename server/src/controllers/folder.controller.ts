import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateFolderBody,
  FolderIdParams,
  RenameFolderNameBody,
} from "../schemas/folder.schema.js";
import { requireAuthUser } from "../utils/session.js";
import {
  createFolderByParentId,
  getFolderById,
  renameFolder,
} from "../services/folder.service.js";

const getFolderByIdHandler = async (
  req: FastifyRequest<{ Params: FolderIdParams }>,
  reply: FastifyReply,
) => {
  const { folderId } = req.params;
  const authUser = requireAuthUser(req);

  const data = await getFolderById({
    userId: authUser.id,
    folderId,
  });

  return reply.success(200, "", data);
};

const createFolderByParentIdHandler = async (
  req: FastifyRequest<{ Body: CreateFolderBody }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);
  const createdFolderMetaData = await createFolderByParentId({
    ...req.body,
    userId: authUser.id,
  });
  reply.success(201, "Folder created successfully", createdFolderMetaData);
};

const renameFolderHandler = async (
  req: FastifyRequest<{ Params: FolderIdParams; Body: RenameFolderNameBody }>,
  reply: FastifyReply,
) => {
  const { folderId } = req.params;
  const authUser = requireAuthUser(req);

   await renameFolder({
    userId: authUser.id,
    folderId,
    name: req.body.name,
  });

  return reply.success(200, "Folder renamed successfully", null);
};

export {
  getFolderByIdHandler,
  createFolderByParentIdHandler,
  renameFolderHandler,
};
