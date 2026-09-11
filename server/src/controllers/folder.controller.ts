import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateFolderBody,
  FolderIdParams,
} from "../schemas/folder.schema.js";
import { requireAuthUser } from "../utils/session.js";
import {
  createFolderByParentId,
  getFolderById,
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
  await createFolderByParentId({ ...req.body, userId: authUser.id });
  reply.success(201, "Folder created successfully", null);
};

export { getFolderByIdHandler, createFolderByParentIdHandler };
