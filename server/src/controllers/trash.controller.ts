import type { FastifyReply, FastifyRequest } from "fastify";
import type { ItemQueryParams } from "../schemas/file.schema.js";
import {
  getTrashedItems,
  restoreItem,
  trashItem,
} from "../services/trash.service.js";
import { requireAuthUser } from "../utils/session.js";

const getTrashedItemsHandler = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  const items = await getTrashedItems({ userId: authUser.id });

  reply.success(200, "Trashed files fetched successfully", items);
};

const trashItemHandler = async (
  req: FastifyRequest<{ Querystring: ItemQueryParams }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  await trashItem({
    userId: authUser.id,
    ...req.query,
  });

  reply.code(204).send();
};

const restoreItemHandler = async (
  req: FastifyRequest<{ Querystring: ItemQueryParams }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  await restoreItem({
    userId: authUser.id,
    ...req.query,
  });

  reply.code(204).send();
};

export { getTrashedItemsHandler, trashItemHandler, restoreItemHandler };
