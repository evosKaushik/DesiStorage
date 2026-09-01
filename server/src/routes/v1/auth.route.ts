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
  forgotPasswordHandler,
  verifyResetPasswordHandler,
  resetPasswordHandler,
  handleGoogleLoginHandler,
} from "../../controllers/auth.controller.js";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  changePasswordSchema,
  forgotPasswordParamsSchema,
  googleLoginSchema,
  loginUserSchema,
  registerUserSchema,
  resetPasswordSchema,
  sessionParamsSchema,
  verifyEmailSchema,
  verifyResetPasswordQuerySchema,
} from "../../schemas/auth.schema.js";
import { authenticate } from "../../middleware/auth.middleware.js";

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
  // forgot password email send
  app.post(
    "/forgot-password/:email",
    {
      schema: {
        params: forgotPasswordParamsSchema,
      },
    },
    forgotPasswordHandler,
  );
  // Verify rest token
  app.get(
    "/verify-reset-token",
    {
      schema: {
        querystring: verifyResetPasswordQuerySchema,
      },
    },
    verifyResetPasswordHandler,
  );
  // Reset password (token + new password)
  app.post(
    "/reset-password",
    {
      schema: {
        body: resetPasswordSchema,
      },
    },
    resetPasswordHandler,
  );
  // Google OAuth2 login route
  app.post(
    "/google",
    {
      schema: {
        body: googleLoginSchema,
      },
    },
    handleGoogleLoginHandler,
  );
};

export default userRoutes;
