import fp from "fastify-plugin";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import type { FastifyPluginAsync } from "fastify";

const mongoosePlugin: FastifyPluginAsync = async (app) => {
  await mongoose.connect(env.MONGODB_URI);

  app.log.info("MongoDB connected");

  app.addHook("onClose", async () => {
    await mongoose.connection.close();
    app.log.info("MongoDB disconnected");
  });
};

export default fp(mongoosePlugin);