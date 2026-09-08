import type { FastifyReply, FastifyRequest } from "fastify";
import type { CreateFolderBody } from "../schemas/folder.schema.js";
import { requireAuthUser } from "../utils/session.js";
import { createFolderByParentId } from "../services/folder.service.js";

const getFolderByIdHandler = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {};

const createFolderByParentIdHandler = async (
  req: FastifyRequest<{ Body: CreateFolderBody }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);
  await createFolderByParentId({ ...req.body, userId: authUser.id });
  reply.success(201, "Folder created successfully", null);
};

export { getFolderByIdHandler, createFolderByParentIdHandler };
