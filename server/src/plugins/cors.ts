
import cors from "@fastify/cors";
import fp from "fastify-plugin";

export default fp(async (app) => {
  await app.register(cors, {
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
});