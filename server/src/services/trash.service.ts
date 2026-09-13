import type { Types } from "mongoose";
import Folder, { type IFolder } from "../models/folder.model.js";
import { ApiError } from "../utils/ApiError.js";
import File, { type IFile } from "../models/file.model.js";

interface trashItemArgument {
  userId: string;
  fileId?: string | undefined;
  folderId?: string | undefined;
}

export interface FileView {
  id: string;
  name: string;
  extension: string;
  size: number;
  mimeType: string;
  parentFolderId: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface FolderView {
  id: string;
  name: string;
  size: number;
  parentFolderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const toFileView = (file: IFile & { _id: Types.ObjectId }): FileView => ({
  id: file._id.toString(),
  name: file.name,
  extension: file.extension,
  size: file.size,
  mimeType: file.mimeType,
  parentFolderId: file.parentFolderId.toString(),
  createdAt: file.createdAt,
  updatedAt: file.updatedAt,
});

const toFolderView = (
  folder: IFolder & { _id: Types.ObjectId },
): FolderView => ({
  id: folder._id.toString(),
  name: folder.name,
  size: folder.size,
  parentFolderId: folder.parentFolderId?.toString() || null,
  createdAt: folder.createdAt,
  updatedAt: folder.updatedAt,
});

const trashItem = async ({ userId, fileId, folderId }: trashItemArgument) => {
  console.log(userId, fileId, folderId);
  if (!fileId && !folderId)
    throw new ApiError(400, "FolderId aur FileId is required");

  if (fileId) {
    console.log("Received FileId");
    const file = await File.findFileByOwner(userId, fileId);

    if (!file) {
      throw new ApiError(404, "File not found");
    }

    if (file.deletedAt) {
      throw new ApiError(400, "File is already in Trash");
    }

    await File.updateOne(
      { _id: file._id as Types.ObjectId },
      { deletedAt: new Date() },
    );
    return;
  }

  if (folderId) {
    console.log("Received FolderId");
    const folder = await Folder.findFolderByOwner(userId, folderId);

    if (!folder) {
      throw new ApiError(404, "Folder not found");
    }

    if (folder.deletedAt) {
      throw new ApiError(400, "Folder is already in Trash");
    }

    await Folder.updateOne(
      { _id: folder._id as Types.ObjectId },
      { deletedAt: new Date() },
    );
    return;
  }
};

const getTrashedItems = async ({ userId }: { userId: string }) => {
  const trashedFiles = await File.findTrashedFiles(userId);
  const trashedFolders = await Folder.findTrashedFolders(userId);

  return {
    files: trashedFiles.map((file) =>
      toFileView(file as IFile & { _id: Types.ObjectId }),
    ),
    folders: trashedFolders.map((folder) =>
      toFolderView(folder as IFolder & { _id: Types.ObjectId }),
    ),
  };
};

const restoreItem = async ({
  userId,
  fileId,
  folderId,
}: trashItemArgument): Promise<void> => {
  if (!fileId && !folderId)
    throw new ApiError(400, "FolderId aur FileId is required");

  if (fileId) {
    const file = await File.findFileByOwner(userId, fileId);

    if (!file) {
      throw new ApiError(404, "File not found");
    }

    if (!file.deletedAt) {
      throw new ApiError(400, "File is not in Trash");
    }

    const duplicate = await File.exists({
      _id: { $ne: file._id as Types.ObjectId },
      userId: file.userId,
      parentFolderId: file.parentFolderId,
      name: file.name,
      extension: file.extension,
      deletedAt: null,
    });

    if (duplicate) {
      throw new ApiError(
        409,
        "A file with this name already exists in this folder",
      );
    }

    await File.updateOne(
      { _id: file._id as Types.ObjectId },
      { deletedAt: null },
    );
    return;
  }

  if (folderId) {
    const folder = await Folder.findFolderByOwner(userId, folderId);

    if (!folder) {
      throw new ApiError(404, "Folder not found");
    }

    if (!folder.deletedAt) {
      throw new ApiError(400, "Folder is not in Trash");
    }

    const duplicate = await Folder.exists({
      _id: { $ne: folder._id as Types.ObjectId },
      userId: folder.userId,
      parentFolderId: folder.parentFolderId,
      name: folder.name,
      deletedAt: null,
    });

    if (duplicate) {
      throw new ApiError(
        409,
        "A folder with this name already exists in this folder",
      );
    }

    await Folder.updateOne(
      { _id: folder._id as Types.ObjectId },
      { deletedAt: null },
    );
    return;
  }
};

export { trashItem, getTrashedItems, restoreItem };
