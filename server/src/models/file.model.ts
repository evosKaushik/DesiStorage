import mongoose, { Schema, Types } from "mongoose";

import {
  fileBaseNameRegex,
  fileExtensionRegex,
  mimeTypeRegex,
  storageNameRegex,
} from "../constants/constant.js";

export interface IFile {
  _id?: Types.ObjectId;
  name: string;
  size: number;
  parentFolderId: Types.ObjectId;
  extension: string;
  mimeType: string;
  userId: Types.ObjectId;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FileModel extends mongoose.Model<IFile> {
  /** Files owned by `userId` that are not in Trash. */
  findActiveFiles(userId: Types.ObjectId | string): Promise<IFile[]>;
  /** Files owned by `userId` that are in Trash (soft-deleted). */
  findTrashedFiles(userId: Types.ObjectId | string): Promise<IFile[]>;
  /**
   * A single file owned by `userId`, regardless of its Trash state.
   * Returns null when the file does not exist or belongs to another user.
   */
  findFileByOwner(
    userId: Types.ObjectId | string,
    fileId: Types.ObjectId | string,
  ): Promise<IFile | null>;
}

const fileSchema = new mongoose.Schema<IFile, FileModel>(
  {
    name: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
      minlength: [1, "File name cannot be empty"],
      maxlength: [255, "File name cannot exceed 255 characters"],
      match: [storageNameRegex, "File name contains invalid characters"],
      validate: {
        validator: (value: string) => fileBaseNameRegex.test(value),
        message:
          "File name cannot contain a dot (provide the extension separately)",
      },
    },

    size: {
      type: Number,
      required: [true, "File size is required"],
      min: [0, "File size cannot be negative"],
    },

    extension: {
      type: String,
      required: [true, "File extension is required"],
      trim: true,
      lowercase: true,
      maxlength: [10, "Extension cannot exceed 10 characters"],
      match: [fileExtensionRegex, "Invalid file extension"],
    },

    mimeType: {
      type: String,
      required: [true, "File mime type is required"],
      trim: true,
      match: [mimeTypeRegex, "Invalid mime type"],
    },

    userId: {
      type: Schema.Types.ObjectId,
      required: [true, "User ID is required"],
      ref: "User",
    },

    parentFolderId: {
      type: Schema.Types.ObjectId,
      required: [true, "Parent Folder ID is required"],
      ref: "Folder",
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

fileSchema.statics.findActiveFiles = function (
  this: FileModel,
  userId: Types.ObjectId | string,
): Promise<IFile[]> {
  return this.find({ userId, deletedAt: null }).exec();
};

fileSchema.statics.findTrashedFiles = function (
  this: FileModel,
  userId: Types.ObjectId | string,
): Promise<IFile[]> {
  return this.find({ userId, deletedAt: { $ne: null } }).exec();
};

fileSchema.statics.findFileByOwner = function (
  this: FileModel,
  userId: Types.ObjectId | string,
  fileId: Types.ObjectId | string,
): Promise<IFile | null> {
  return this.findOne({ _id: fileId, userId }).exec();
};

// A trashed file may share a name with its restored replacement. Active
// files, however, must remain unique within their parent folder even under
// concurrent uploads or renames.
fileSchema.index(
  { userId: 1, parentFolderId: 1, name: 1, extension: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);

const File = mongoose.model<IFile, FileModel>("File", fileSchema);

export default File;
