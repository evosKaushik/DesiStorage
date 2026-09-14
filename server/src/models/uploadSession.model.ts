import mongoose, { type InferSchemaType } from "mongoose";

const uploadSessionSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Target folder for the eventual File record; null = root.
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
      index: true,
    },

    strategy: {
      type: String,
      enum: ["simple", "multipart"],
      required: true,
    },

    // Storage provider's multipart upload ID
    storageUploadId: {
      type: String,
      default: null,
    },

    fileSize: {
      type: Number,
      required: true,
      min: [0, "File size cannot be negative"],
    },

    // Only meaningful for multipart uploads
    partSize: {
      type: Number,
      default: null,
    },

    totalParts: {
      type: Number,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "uploading",
        "paused",
        "completed",
        "aborted",
        "expired",
        "failed",
      ],
      default: "pending",
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Auto-cleanup: Mongo's TTL monitor deletes the session once expiresAt
// passes, so stale/expired upload sessions never accumulate.
uploadSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type UploadSession = InferSchemaType<typeof uploadSessionSchema>;

const UploadSessionModel = mongoose.model("UploadSession", uploadSessionSchema);

export default UploadSessionModel;
