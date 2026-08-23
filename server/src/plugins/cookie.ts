import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
import type { FastifyPluginAsync } from "fastify";
import { ENV } from "../config/env.js";

const cookiePlugin: FastifyPluginAsync = async (app) => {
  await app.register(cookie, {
    secret: ENV.COOKIE_SECRET, // for signed cookies
    hook: "onRequest",
  });
};

export default fp(cookiePlugin);
