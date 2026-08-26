import helmet from "@fastify/helmet";
import fp from "fastify-plugin";

// Must be fp-wrapped: a plain async wrapper creates an encapsulated
// context, so the security headers never reach sibling route contexts.
export default fp(async (app) => {
  await app.register(helmet);
});
