import Fastify from "fastify";
import cors from "@fastify/cors";

const app = Fastify();

await app.register(cors, {
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

app.post("/ping", async () => ({ ok: true }));

await app.listen({ port: 5001, host: "127.0.0.1" });
console.log("repro up");
