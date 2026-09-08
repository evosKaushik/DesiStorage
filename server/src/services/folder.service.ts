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
  const existingParentFolder = Folder.findById(parentId).lean();

  console.log(existingParentFolder);

  if (!existingParentFolder) {
    throw new ApiError(404, "Parent Folder Does not exist!");
  }

  await Folder.create({
    name: folderName,
    parentFolderId: parentId,
    userId,
  });

};

export { createFolderByParentId };
