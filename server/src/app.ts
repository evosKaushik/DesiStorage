import Fastify from "fastify";
import { loggerConfig } from "./lib/logger.js";
import corsPlugin from "./plugins/cors.js";
import helmetPlugin from "./plugins/helmet.js";
import routes from "./routes/index.js";
import mongoosePlugin from "./plugins/mongoose.js";

export const app = Fastify({
  logger: loggerConfig,
});

await app.register(corsPlugin);
await app.register(helmetPlugin);
await app.register(routes);
await app.register(mongoosePlugin);
