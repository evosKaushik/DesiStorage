import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CompleteUploadParams,
  FileIdParams,
  GetUploadPresignedUrlBody,
} from "../schemas/file.schema.js";
import { requireAuthUser } from "../utils/session.js";
import {
  completeFileUpload,
  getFileStream,
  getUploadPresignedUrl,
} from "../services/file.service.js";

const getContentDisposition = (
  filename: string,
  type: "inline" | "attachment",
): string => {
  const asciiSafe = filename.replace(/[^\x20-\x7e]/g, "_");

  return `${type}; filename="${asciiSafe}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
};

const getUploadPresignedUrlHandler = async (
  req: FastifyRequest<{ Body: GetUploadPresignedUrlBody }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  const data = await getUploadPresignedUrl({
    ...req.body,
    userId: authUser.id,
  });

  reply.success(200, "Presigned URL generated successfully", data);
};

const completeFileUploadHandler = async (
  req: FastifyRequest<{ Params: CompleteUploadParams }>,
  reply: FastifyReply,
) => {
  const authUser = requireAuthUser(req);

  const file = await completeFileUpload({
    userId: authUser.id,
    uploadId: req.params.uploadId,
  });

  reply.success(201, "File registered successfully", { file });
};

const streamFileByIdHandler =
  (disposition: "inline" | "attachment") =>
  async (
    req: FastifyRequest<{ Params: FileIdParams }>,
    reply: FastifyReply,
  ) => {
    const authUser = requireAuthUser(req);

    const { fileName, mimeType, stream, contentLength } = await getFileStream({
      userId: authUser.id,
      fileId: req.params.fileId,
    });

    reply.hijack();
    reply.raw.statusCode = 200;
    reply.raw.setHeader("Content-Type", mimeType);
    reply.raw.setHeader(
      "Content-Disposition",
      getContentDisposition(fileName, disposition),
    );
    reply.raw.setHeader("Cache-Control", "private, max-age=86400");
    reply.raw.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    reply.raw.setHeader("Access-Control-Allow-Credentials", "true");

    if (typeof contentLength === "string" || typeof contentLength === "number") {
      reply.raw.setHeader("Content-Length", contentLength);
    }

    reply.raw.on("close", () => {
      stream.destroy();
    });
    stream.on("error", () => {
      reply.raw.destroy();
    });
    stream.pipe(reply.raw);
  };

const getFilePreviewHandler = streamFileByIdHandler("inline");
const getFileDownloadHandler = streamFileByIdHandler("attachment");

export {
  getUploadPresignedUrlHandler,
  completeFileUploadHandler,
  getFilePreviewHandler,
  getFileDownloadHandler,
};
