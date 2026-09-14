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
  const app = Fastify({
    logger,
    // S3 multipart UploadIds can comfortably exceed Fastify's default
    // maxParamLength of 100, so `/upload/:uploadId/parts` needs headroom.
    maxParamLength: 2048,
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler((error: FastifyError, req, reply) => {
    reply.log.error(error);
    if (error.validation) {
      const details = error.validation.map((err) => {
        const params = err.params as { missingProperty?: string } | undefined;

        const field =
          typeof params?.missingProperty === "string"
            ? params.missingProperty
            : err.instancePath.replace(/^\//, "");

        return {
          field: field || "body",
          message: err.message,
        };
      });

      return reply.code(400).send({
        success: false,
        message: `Validation failed: ${details[0]?.field}`,
        errors: details,
      });
    }

    if (error instanceof ApiError) {
      return reply.code(error.statusCode).send({
        success: false,
        message: error.message,
      });
    }

    if (error.name === "ValidationError") {
      const details = Object.entries(
        (error as unknown as { errors: Record<string, { message: string }> })
          .errors,
      ).map(([field, err]) => ({
        field,
        message: err.message,
      }));

      return reply.code(400).send({
        success: false,
        message: `Validation failed: ${details[0]?.field}`,
        errors: details,
      });
    }

    if (error.name === "CastError") {
      return reply.code(400).send({
        success: false,
        message: "Invalid ID provided",
      });
    }

    if ("code" in error && Number(error.code) === 11000) {
      return reply.code(409).send({
        success: false,
        message: "Email already exists",
      });
    }

    req.log.error(error);

    return reply.code(500).send({
      success: false,
      message: "Internal Server Error",
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
