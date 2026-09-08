import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { createFolderByParentIdHandler, getFolderByIdHandler } from "../../controllers/folder.controller.js";
import { requireVerifiedEmail } from "../../middleware/auth.middleware.js";
import { createFolderSchema } from "../../schemas/folder.schema.js";

const folderRoutes: FastifyPluginAsyncZod = async (app) => {
  // Get Folder
  app.get(
    "/:id",
    {
      preHandler: requireVerifiedEmail,
    },
    getFolderByIdHandler,
  );
  app.post(
    "/",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        body: createFolderSchema,
      },
    },
    createFolderByParentIdHandler,
  );
};

export default folderRoutes;
