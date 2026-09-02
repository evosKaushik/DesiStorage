import { buildApp } from "./app.js";
import { ENV } from "./config/env.js";
import { redisClient } from "./config/redis.js";

async function start() {
  const app = await buildApp();

  try {
    await redisClient.connect();

    await app.listen({
      port: ENV.PORT,
      host: ENV.HOST,
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();