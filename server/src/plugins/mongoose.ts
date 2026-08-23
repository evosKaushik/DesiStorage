import fp from "fastify-plugin";
import mongoose from "mongoose";
import { ENV } from "../config/env.js";
import type { FastifyPluginAsync } from "fastify";

const mongoosePlugin: FastifyPluginAsync = async (app) => {
  await mongoose.connect(ENV.MONGODB_URI);

  app.log.info("MongoDB connected");

  app.addHook("onClose", async () => {
    await mongoose.connection.close();
    app.log.info("MongoDB disconnected");
  });
};

export default fp(mongoosePlugin);