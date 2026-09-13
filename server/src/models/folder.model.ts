import mongoose, { Schema, Types } from "mongoose";

import { storageNameRegex } from "../constants/constant.js";

export interface IFolder {
  _id?: Types.ObjectId;
  name: string;
  size: number;
  parentFolderId: Types.ObjectId | null;
  userId: Types.ObjectId;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FolderModel extends mongoose.Model<IFolder> {
  /** Folder owned by `userId` that are not in Trash. */
  findActiveFolders(userId: Types.ObjectId | string): Promise<IFolder[]>;
  /** Folder owned by `userId` that are in Trash (soft-deleted). */
  findTrashedFolders(userId: Types.ObjectId | string): Promise<IFolder[]>;
  /**
   * A single folder owned by `userId`, regardless of its Trash state.
   * Returns null when the folder does not exist or belongs to another user.
   */
  findFolderByOwner(
    userId: Types.ObjectId | string,
    folderId: Types.ObjectId | string,
  ): Promise<IFolder | null>;
}

const folderSchema = new mongoose.Schema<IFolder, FolderModel>(
  {
    name: {
      type: String,
      required: [true, "Folder name is required"],
      trim: true,
      minlength: [1, "Folder name cannot be empty"],
      maxlength: [255, "Folder name cannot exceed 255 characters"],
      match: [storageNameRegex, "Folder name contains invalid characters"],
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

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

folderSchema.statics.findActiveFolders = function (
  this: FolderModel,
  userId: Types.ObjectId | string,
): Promise<IFolder[]> {
  return this.find({ userId, deletedAt: null }).exec();
};

folderSchema.statics.findTrashedFolders = function (
  this: FolderModel,
  userId: Types.ObjectId | string,
): Promise<IFolder[]> {
  return this.find({ userId, deletedAt: { $ne: null } }).exec();
};

folderSchema.statics.findFolderByOwner = function (
  this: FolderModel,
  userId: Types.ObjectId | string,
  fileId: Types.ObjectId | string,
): Promise<IFolder | null> {
  return this.findOne({ _id: fileId, userId }).exec();
};

const Folder = mongoose.model<IFolder, FolderModel>("Folder", folderSchema);

export default Folder;
