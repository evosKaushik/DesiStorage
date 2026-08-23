import { createClient } from "redis";
import { ENV } from "./env.js";
import { app } from "../app.js";

export const redisClient = createClient({
  url: ENV.REDIS_URL,
});

redisClient.on("ready", () => {
  app.log.info("Redis connected and ready")
});
redisClient.on("error", (error) => {
  console.error("Redis Client Error:", error);
});
