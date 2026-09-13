import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  createFolderByParentIdHandler,
  getFolderByIdHandler,
  renameFolderHandler,
} from "../../controllers/folder.controller.js";
import { requireVerifiedEmail } from "../../middleware/auth.middleware.js";
import {
  createFolderSchema,
  folderIdSchema,
  renameFolderNameSchema,
} from "../../schemas/folder.schema.js";

const folderRoutes: FastifyPluginAsyncZod = async (app) => {
  // Get Folder
  app.get(
    "/:folderId",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        params: folderIdSchema,
      },
    },
    getFolderByIdHandler,
  );
  // Create Folder
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
  // Rename Folder
  app.patch(
    "/:folderId/name",
    {
      preHandler: requireVerifiedEmail,
      schema: {
        params: folderIdSchema,
        body: renameFolderNameSchema,
      },
    },
    renameFolderHandler,
  );
  // Move Folder To Trash
};

export default folderRoutes;
