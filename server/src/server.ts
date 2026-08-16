import { app } from "./app.js";
import { env } from "./config/env.js";

async function start() {
  try {
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();