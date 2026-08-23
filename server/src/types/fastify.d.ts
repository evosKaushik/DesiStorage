import "fastify";
import type { ObjectId } from "mongoose";

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
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}