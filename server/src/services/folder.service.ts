import File from "../models/file.model.js";
import Folder from "../models/folder.model.js";
import type { CreateFolderBody } from "../schemas/folder.schema.js";
import { ApiError } from "../utils/ApiError.js";

interface CreateFolderByParentIdParameter extends CreateFolderBody {
  userId: string;
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
    });

    if (!existingParentFolder) {
      throw new ApiError(404, "Parent Folder Does not exist!");
    }
  }

  await Folder.create({
    name: folderName,
    parentFolderId: parentId ?? null,
    userId,
  });
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
      .select(
        "_id name extension size parentFolderId createdAt updatedAt",
      )
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

export { createFolderByParentId, getFolderById };
