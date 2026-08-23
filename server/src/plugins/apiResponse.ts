import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyReply } from "fastify";

const apiResponsePlugin: FastifyPluginAsync = async (app) => {
  app.decorateReply("success", function <
    T,
  >(this: FastifyReply, status = 200, message = "Success", data?: T) {
    return this.code(status).send({
      success: true,
      message,
      data,
    });
  });

  app.decorateReply(
    "error",
    function (
      this: FastifyReply,
      status = 500,
      message = "Something went wrong",
    ) {
      return this.code(status).send({
        success: false,
        message,
      });
    },
  );
};

export default fp(apiResponsePlugin);
