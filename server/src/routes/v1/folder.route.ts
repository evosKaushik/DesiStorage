import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { createFolderByParentIdHandler, getFolderByIdHandler } from "../../controllers/folder.controller.js";
import { requireVerifiedEmail } from "../../middleware/auth.middleware.js";
import { createFolderSchema, FolderIdSchema } from "../../schemas/folder.schema.js";

const folderRoutes: FastifyPluginAsyncZod = async (app) => {
  // Get Folder
  app.get(
    "/:folderId",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        params: FolderIdSchema
      }
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
