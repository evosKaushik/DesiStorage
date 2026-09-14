import mongoose, { type InferSchemaType } from "mongoose";

const uploadPartSchema = new mongoose.Schema(
  {
    uploadSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UploadSession",
      required: true,
    },

    partNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    etag: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  },
);

uploadPartSchema.index({ uploadSessionId: 1, partNumber: 1 }, { unique: true });

export type UploadPart = InferSchemaType<typeof uploadPartSchema>;

const UploadPartModel = mongoose.model("UploadPart", uploadPartSchema);

export default UploadPartModel;
