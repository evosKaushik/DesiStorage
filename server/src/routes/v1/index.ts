import type { FastifyPluginAsync } from "fastify";

import authRoutes from "./auth.route.js";

const v1Routes: FastifyPluginAsync = async (app) => {
  await app.register(authRoutes, {
    prefix: "/v1/auth",
  });

};

export default v1Routes;