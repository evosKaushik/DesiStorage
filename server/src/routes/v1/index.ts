import type { FastifyPluginAsync } from "fastify";

import authRoutes from "./auth.route.js";
import folderRoutes from "./folder.route.js";
import fileRoutes from "./files.route.js";
import trashRoutes from "./trash.route.js";

const v1Routes: FastifyPluginAsync = async (app) => {
  await app.register(authRoutes, {
    prefix: "/v1/auth",
  });
  await app.register(folderRoutes, {
    prefix: "/v1/folders",
  })
  await app.register(fileRoutes, {
    prefix: "/v1/files",
  })
  await app.register(trashRoutes, {
    prefix: "/v1/trash",
  })
};

export default v1Routes;