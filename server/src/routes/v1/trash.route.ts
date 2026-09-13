import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { requireVerifiedEmail } from "../../middleware/auth.middleware.js";
import { itemQuerySchema } from "../../schemas/file.schema.js";
import {
  emptyTrashHandler,
  getTrashedFilesHandler,
  restoreFileHandler,
} from "../../controllers/file.controller.js";
import {
  getTrashedItemsHandler,
  restoreItemHandler,
  trashItemHandler,
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

  app.delete(
    "/",
    {
      preHandler: requireVerifiedEmail,
    },
    emptyTrashHandler,
  );
  // Move a Items to Trash (soft delete)
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
  // Restore a File from Trash
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
};

export default trashRoutes;
