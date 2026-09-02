import Fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify";
import { loggerConfig } from "./lib/logger.js";

import corsPlugin from "./plugins/cors.js";
import helmetPlugin from "./plugins/helmet.js";
import mongoosePlugin from "./plugins/mongoose.js";
import apiResponsePlugin from "./plugins/apiResponse.js";
import cookiePlugin from "./plugins/cookie.js";

import routes from "./routes/index.js";

import {
  validatorCompiler,
  serializerCompiler,
} from "fastify-type-provider-zod";

import { ApiError } from "./utils/ApiError.js";

export interface BuildAppOptions {
  logger?: FastifyServerOptions["logger"];
  database?: boolean;
}

export async function buildApp({
  logger = loggerConfig,
  database = true,
}: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger });

app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error.validation) {
      return reply.code(400).send({
        success: false,
        message: "Validation failed",
        errors: error.validation.map((err) => err.message),
      });
    }

    if (error instanceof ApiError) {
      return reply.code(error.statusCode).send({
        success: false,
        message: error.message,
      });
    }

    if ("code" in error && Number(error.code) === 11000) {
      return reply.code(409).send({
        success: false,
        message: "Email already exists",
      });
    }

    request.log.error(error);

    return reply.code(500).send({
      success: false,
      message: error.message || "Internal Server Error",
    });
  });

  // Plugins
  await app.register(corsPlugin);
  await app.register(helmetPlugin);
  await app.register(apiResponsePlugin);
  await app.register(cookiePlugin);
  if (database) await app.register(mongoosePlugin);

  // Routes
  await app.register(routes);

  return app;
}