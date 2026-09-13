import { Types } from "mongoose";
import File from "../models/file.model.js";
import Folder from "../models/folder.model.js";
import type { CreateFolderBody } from "../schemas/folder.schema.js";
import { ApiError } from "../utils/ApiError.js";

interface CreateFolderByParentIdParameter extends CreateFolderBody {
  userId: string;
}

interface RenameFolderParameter {
  userId: string;
  folderId: string;
  name: string;
}

const createFolderByParentId = async ({
  folderName,
  parentId,
  userId,
}: CreateFolderByParentIdParameter) => {
  if (parentId) {
    const existingParentFolder = await Folder.exists({
      _id: parentId,
      userId,
      deletedAt: null,
    });

    if (!existingParentFolder) {
      throw new ApiError(404, "Parent Folder Does not exist!");
    }
  }
  const duplicate = await Folder.exists({
    userId: userId,
    parentFolderId: parentId,
    name: folderName,
    deletedAt: null,
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
    deletedAt: null,
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
      deletedAt: null,
    })
      .select("_id name parentFolderId")
      .lean(),

    File.find({
      parentFolderId: folderId,
      userId,
      deletedAt: null,
    })
      .select("_id name extension size mimeType parentFolderId")
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
    })),

    files: files.map((file) => ({
      id: file._id.toString(),
      name: file.name,
      extension: file.extension,
      size: file.size,
      mimeType: file.mimeType,
      parentFolderId: file.parentFolderId.toString(),
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
    deletedAt: null,
  });

  if (!folder) {
    throw new ApiError(404, "Folder not found");
  }

  if (folder.name === name) {
    return;
  }

  const duplicate = await Folder.exists({
    _id: { $ne: folder._id },
    userId: folder.userId,
    parentFolderId: folder.parentFolderId,
    name,
    deletedAt: null,
  });

  if (duplicate) {
    throw new ApiError(
      409,
      "A folder with this name already exists in this folder",
    );
  }

  const updatedFolder = await Folder.findOneAndUpdate(
    { _id: folder._id, userId, deletedAt: null },
    { name },
    { returnDocument: "after", runValidators: true },
  );

  if (!updatedFolder) {
    throw new ApiError(404, "Folder not found");
  }

  return;
};

export { createFolderByParentId, getFolderById, renameFolder };
