import {
  createUserHandler,
  loginUserHandler,
  getUserHandler,
  verifyEmailHandler,
  sendVerificationHandler,
  logoutHandler,
  changePasswordHandler,
  getAllSessionsHandler,
  logoutSessionHandler,
  logoutAllSessionsHandler,
} from "../../controllers/auth.controller.js";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  changePasswordSchema,
  loginUserSchema,
  registerUserSchema,
  verifyEmailSchema,
} from "../../schemas/auth.schema.js";
import { z } from "zod";
import { authenticate } from "../../middleware/auth.middleware.js";

const sessionParamsSchema = z.object({
  sessionId: z.string().min(1),
});

const userRoutes: FastifyPluginAsyncZod = async (app) => {
  // Register Route
  app.post(
    "/register",
    {
      schema: {
        body: registerUserSchema,
      },
    },
    createUserHandler,
  );
  // Login Route
  app.post(
    "/login",
    {
      schema: {
        body: loginUserSchema,
      },
    },
    loginUserHandler,
  );
  // Get Login User Me
  app.get("/", { preHandler: authenticate }, getUserHandler);
  // Send Email Route
  app.post(
    "/send-email",
    { preHandler: authenticate },
    sendVerificationHandler,
  );
  // Verify Email Route
  app.post(
    "/verify-email",
    {
      schema: {
        body: verifyEmailSchema,
      },
      preHandler: authenticate,
    },
    verifyEmailHandler,
  );
  // Logout Route
  app.post("/logout", { preHandler: authenticate }, logoutHandler);
  app.post(
    "/change-password",
    {
      schema: {
        body: changePasswordSchema,
      },
      preHandler: authenticate,
    },
    changePasswordHandler,
  );
  // Get All Active Sessions
  app.get("/sessions", { preHandler: authenticate }, getAllSessionsHandler);
  // Logout from all devices (including current)
  app.post(
    "/logout/all",
    { preHandler: authenticate },
    logoutAllSessionsHandler,
  );
  // Logout a Specific Session
  app.post(
    "/logout/:sessionId",
    {
      schema: {
        params: sessionParamsSchema,
      },
      preHandler: authenticate,
    },
    logoutSessionHandler,
  );
};

export default userRoutes;
