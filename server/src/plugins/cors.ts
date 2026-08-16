import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";

export default async function (app: FastifyInstance) {
  await app.register(cors, {
    origin: true,
    credentials: true,
  });
}
