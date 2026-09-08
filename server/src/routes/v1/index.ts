import type { FastifyPluginAsync } from "fastify";

import authRoutes from "./auth.route.js";
import folderRoutes from "./folder.route.js";

const v1Routes: FastifyPluginAsync = async (app) => {
  await app.register(authRoutes, {
    prefix: "/v1/auth",
  });
  await app.register(folderRoutes, {
    prefix: "/v1/folder",
  })
};

export default v1Routes;