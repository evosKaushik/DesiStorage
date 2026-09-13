import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { requireVerifiedEmail } from "../../middleware/auth.middleware.js";
import {
  itemQuerySchema,
  permanentDeleteBodySchema,
  permanentDeleteQuerySchema,
  trashBulkSchema,
} from "../../schemas/trash.schema.js";
import {
  getTrashedItemsHandler,
  permanentDeleteHandler,
  restoreItemHandler,
  restoreItemsHandler,
  trashItemHandler,
  trashItemsHandler,
} from "../../controllers/trash.controller.js";

const trashRoutes: FastifyPluginAsyncZod = async (app) => {
  // Get Trash Items
  app.get(
    "/",
    {
      preHandler: requireVerifiedEmail,
    },
    getTrashedItemsHandler,
  );

  // Move a Item to Trash (soft delete)
  app.post(
    "/",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        querystring: itemQuerySchema,
      },
    },
    trashItemHandler,
  );
  // Move multiple files and folders to Trash (soft delete)
  app.post(
    "/bulk",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        body: trashBulkSchema,
      },
    },
    trashItemsHandler,
  );
  // Restore a Item from Trash
  app.post(
    "/restore",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        querystring: itemQuerySchema,
      },
    },
    restoreItemHandler,
  );
  // Restore multiple files and folders from Trash
  app.post(
    "/restore/bulk",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        body: trashBulkSchema,
      },
    },
    restoreItemsHandler,
  );
  // Permanently delete: action=file (single) / action=multiple (ids in body)
  // / action=empty (no body, wipes the whole Trash)
  app.delete(
    "/permanent",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        querystring: permanentDeleteQuerySchema,
        body: permanentDeleteBodySchema,
      },
    },
    permanentDeleteHandler,
  );
};

export default trashRoutes;
