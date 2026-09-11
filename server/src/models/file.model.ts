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
  createdAt: Date;
  updatedAt: Date;
}

type FileModel = mongoose.Model<IFile>;

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
  },
  {
    timestamps: true,
  },
);

const File = mongoose.model<IFile, FileModel>("File", fileSchema);

export default File;
