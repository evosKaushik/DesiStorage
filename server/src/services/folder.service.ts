import { Types } from "mongoose";
import File from "../models/file.model.js";
import Folder, { type IFolder } from "../models/folder.model.js";
import type { CreateFolderBody } from "../schemas/folder.schema.js";
import { storageNameRegex } from "../constants/constant.js";
import { ApiError } from "../utils/ApiError.js";

interface CreateFolderByParentIdParameter extends CreateFolderBody {
  userId: string;
}

interface RenameFolderParameter {
  userId: string;
  folderId: string;
  name: string;
}

export interface FolderView {
  id: string;
  name: string;
  size: number;
  parentFolderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const toFolderView = (
  folder: IFolder & { _id: Types.ObjectId },
): FolderView => ({
  id: folder._id.toString(),
  name: folder.name,
  size: folder.size,
  parentFolderId: folder.parentFolderId?.toString() ?? null,
  createdAt: folder.createdAt,
  updatedAt: folder.updatedAt,
});

const createFolderByParentId = async ({
  folderName,
  parentId,
  userId,
}: CreateFolderByParentIdParameter) => {
  if (parentId) {
    const existingParentFolder = await Folder.exists({
      _id: parentId,
      userId,
    });

    if (!existingParentFolder) {
      throw new ApiError(404, "Parent Folder Does not exist!");
    }
  }
  const duplicate = await Folder.exists({
    userId: userId,
    parentFolderId: parentId,
    name: folderName,
  });

  if (duplicate) {
    throw new ApiError(
      409,
      "A folder with this name already exists in this folder",
    );
  }

  const createdFolder = await Folder.create({
    name: folderName,
    parentFolderId: parentId ?? null,
    userId,
  });

  return {
    id: createdFolder._id,
  };
};

const getFolderById = async ({
  userId,
  folderId,
}: {
  userId: string;
  folderId: string;
}) => {
  const folder = await Folder.findOne({
    _id: folderId,
    userId,
  })
    .select("_id name parentFolderId")
    .lean();

  if (!folder) {
    throw new ApiError(404, "Folder not found");
  }

  const [folders, files] = await Promise.all([
    Folder.find({
      parentFolderId: folderId,
      userId,
    })
      .select("_id name parentFolderId createdAt updatedAt")
      .lean(),

    File.find({
      parentFolderId: folderId,
      userId,
    })
      .select("_id name extension size parentFolderId createdAt updatedAt")
      .lean(),
  ]);

  return {
    folder: {
      id: folder._id.toString(),
      name: folder.name,
      parentFolderId: folder.parentFolderId?.toString() ?? null,
    },

    folders: folders.map((folder) => ({
      id: folder._id.toString(),
      name: folder.name,
      parentFolderId: folder.parentFolderId?.toString() ?? null,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    })),

    files: files.map((file) => ({
      id: file._id.toString(),
      name: file.name,
      extension: file.extension,
      size: file.size,
      mimeType: file.mimeType,
      parentFolderId: file.parentFolderId.toString(),
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    })),
  };
};

const renameFolder = async ({
  userId,
  folderId,
  name,
}: RenameFolderParameter) => {
  if (!Types.ObjectId.isValid(folderId)) {
    throw new ApiError(400, "Invalid folder ID");
  }

  const folder = await Folder.findOne({
    _id: folderId,
    userId,
  });

  if (!folder) {
    throw new ApiError(404, "Folder not found");
  }

  if (folder.name === name) {
    return ;
  }

  const duplicate = await Folder.exists({
    _id: { $ne: folder._id },
    userId: folder.userId,
    parentFolderId: folder.parentFolderId,
    name,
  });

  if (duplicate) {
    throw new ApiError(
      409,
      "A folder with this name already exists in this folder",
    );
  }

  const updatedFolder = await Folder.findByIdAndUpdate(
    folder._id,
    { name },
    { returnDocument: "after", runValidators: true },
  );

  if (!updatedFolder) {
    throw new ApiError(404, "Folder not found");
  }
};

export { createFolderByParentId, getFolderById, renameFolder };
