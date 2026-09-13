import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  ItemQueryParams,
  PermanentDeleteBody,
  PermanentDeleteQueryParams,
  TrashBulkBody,
} from "../schemas/trash.schema.js";
import {
  emptyTrash,
  getTrashedItems,
  permanentDeleteItems,
  restoreItem,
  restoreItems,
  trashItem,
  trashItems,
} from "../services/trash.service.js";
import { ApiError } from "../utils/ApiError.js";
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

const trashItemsHandler = async (
  req: FastifyRequest<{ Body: TrashBulkBody }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  await trashItems({
    userId: authUser.id,
    ...req.body,
  });

  return reply.code(204).send();
};

const restoreItemsHandler = async (
  req: FastifyRequest<{ Body: TrashBulkBody }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  await restoreItems({
    userId: authUser.id,
    ...req.body,
  });

  return reply.code(204).send();
};

const permanentDeleteHandler = async (
  req: FastifyRequest<{
    Querystring: PermanentDeleteQueryParams;
    Body: PermanentDeleteBody;
  }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);
  const { action } = req.query;
  const itemIds = req.body?.itemIds ?? [];

  if (action === "empty") {
    await emptyTrash({ userId: authUser.id });
    return reply.code(204).send();
  }

  if (itemIds.length === 0) {
    throw new ApiError(400, "itemIds are required for this action");
  }

  if (action === "file" && itemIds.length !== 1) {
    throw new ApiError(400, "action=file expects exactly one item id");
  }

  await permanentDeleteItems({ userId: authUser.id, itemIds });

  return reply.code(204).send();
};

export {
  getTrashedItemsHandler,
  trashItemHandler,
  restoreItemHandler,
  trashItemsHandler,
  restoreItemsHandler,
  permanentDeleteHandler,
};
