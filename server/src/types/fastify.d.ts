import "fastify";
import type { ObjectId } from "mongoose";
import type { AuthProvider } from "../models/user.model.ts";

declare module "fastify" {
  interface FastifyReply {
    success<T>(status?: number, message?: string, data?: T): FastifyReply;

    error(status?: number, message?: string): FastifyReply;
  }
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatar: string;
  storageLimit: number;
  storageUsed: number;
  isEmailVerified: boolean;
  authProviders: AuthProvider[];
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}
