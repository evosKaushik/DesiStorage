import type { FastifyReply } from "fastify";
import { ENV } from "../config/env.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: ENV.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  signed: true,
};

const setSessionIdCookie = (
  reply: FastifyReply,
  token: string,
  maxAge?: number,
) => {
  reply.setCookie("sid", token, {
    ...COOKIE_OPTIONS,
    maxAge: maxAge ? maxAge : 30 * 24 * 60 * 60, // 30 Days
  });
};

const clearSessionIdCookie = (reply: FastifyReply) => {
  reply.clearCookie("sid", {
    path: "/",
  });
};

export { setSessionIdCookie, clearSessionIdCookie };
