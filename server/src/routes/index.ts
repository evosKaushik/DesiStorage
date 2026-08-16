import type { FastifyPluginAsync } from "fastify";
import v1Routes from "./v1/index.js";

const routes: FastifyPluginAsync = async (app) => {
  await app.register(v1Routes, {
    prefix: "/api",
  });
};

export default routes;