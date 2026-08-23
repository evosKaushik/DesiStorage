import type { FastifyPluginAsync } from "fastify";
import v1Routes from "./v1/index.js";
import healthRoutes from "./health.route.js";

const routes: FastifyPluginAsync = async (app) => {
  await app.register(healthRoutes);

  await app.register(v1Routes, {
    prefix: "/api",
  });
};

export default routes;