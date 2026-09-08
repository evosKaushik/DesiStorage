import mongoose, { Schema, Types } from "mongoose";

import { storageNameRegex } from "../constants/constant.js";

export interface IFolder {
  _id?: Types.ObjectId;
  name: string;
  size: number;
  parentFolderId: Types.ObjectId | null;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

type FolderModel = mongoose.Model<IFolder>;

const folderSchema = new mongoose.Schema<IFolder, FolderModel>(
  {
    name: {
      type: String,
      required: [true, "Folder name is required"],
      trim: true,
      minlength: [1, "Folder name cannot be empty"],
      maxlength: [255, "Folder name cannot exceed 255 characters"],
      match: [
        storageNameRegex,
        "Folder name contains invalid characters",
      ],
    },

    size: {
      type: Number,
      required: [true, "Folder size is required"],
      default: 0,
      min: [0, "Folder size cannot be negative"],
    },

    userId: {
      type: Schema.Types.ObjectId,
      required: [true, "User ID is required"],
      ref: "User",
    },

    parentFolderId: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "Folder",
    },
  },
  {
    timestamps: true,
  },
);

const Folder = mongoose.model<IFolder, FolderModel>(
  "Folder",
  folderSchema,
);

export default Folder;