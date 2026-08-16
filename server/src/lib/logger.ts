import type { FastifyServerOptions } from "fastify";

export const loggerConfig: NonNullable<FastifyServerOptions["logger"]> =
  process.env.NODE_ENV === "production"
    ? true
    : {
        transport: {
          target: "pino-pretty",
        },
      };
