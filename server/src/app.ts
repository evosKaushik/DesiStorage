import Fastify, { type FastifyError } from "fastify";
import { loggerConfig } from "./lib/logger.js";
import corsPlugin from "./plugins/cors.js";
import helmetPlugin from "./plugins/helmet.js";
import mongoosePlugin from "./plugins/mongoose.js";
import apiResponsePlugin from "./plugins/apiResponse.js";
import routes from "./routes/index.js";
import cookiePlugin from "./plugins/cookie.js";

import {
  validatorCompiler,
  serializerCompiler,
} from "fastify-type-provider-zod";
import { ApiError } from "./utils/ApiError.js";

export const app = Fastify({
  logger: loggerConfig,
});

// Zod configuration (must be before routes)
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Global error handler
app.setErrorHandler((error: FastifyError, request, reply) => {
  if (error.validation) {
    return reply.code(400).send({
      success: false,
      message: "Validation failed",
      errors: error.validation.map((err, _) => {
        return err.message;
      }),
    });
  }

  if (error instanceof ApiError) {
    return reply.code(error.statusCode).send({
      success: false,
      message: error.message,
    });
  }

  if ("code" in error && error.code === "11000") {
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
// Register plugins
await app.register(corsPlugin);
await app.register(helmetPlugin);
await app.register(apiResponsePlugin);
await app.register(mongoosePlugin);
await app.register(cookiePlugin);

// Register routes last
await app.register(routes);
