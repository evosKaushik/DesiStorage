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

export { createFolderByParentId };
