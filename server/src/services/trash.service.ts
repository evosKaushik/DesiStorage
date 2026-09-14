import { Types } from "mongoose";
import Folder, { type IFolder } from "../models/folder.model.js";
import { ApiError } from "../utils/ApiError.js";
import File, { type IFile } from "../models/file.model.js";
import User from "../models/user.model.js";
import { redisClient } from "../config/redis.js";
import { getUserProfileCacheKey } from "../utils/cacheKeys.js";
import { deleteFileObject } from "../utils/awsS3.js";

interface trashItemArgument {
  userId: string;
  fileId?: string | undefined;
  folderId?: string | undefined;
}

interface trashItemsArgument {
  userId: string;
  /** ObjectIds (as hex strings) of the files to trash/restore. */
  fileIds: string[];
  /** ObjectIds (as hex strings) of the folders to trash/restore. */
  folderIds: string[];
}

export interface FileView {
  id: string;
  name: string;
  extension: string;
  size: number;
  mimeType: string;
  parentFolderId: string;
}
export interface FolderView {
  id: string;
  name: string;
  size: number;
  parentFolderId: string | null;
}

const toFileView = (file: IFile & { _id: Types.ObjectId }): FileView => ({
  id: file._id.toString(),
  name: file.name,
  extension: file.extension,
  size: file.size,
  mimeType: file.mimeType,
  parentFolderId: file.parentFolderId.toString(),
});

const toFolderView = (
  folder: IFolder & { _id: Types.ObjectId },
): FolderView => ({
  id: folder._id.toString(),
  name: folder.name,
  size: folder.size,
  parentFolderId: folder.parentFolderId?.toString() || null,
});

/**
 * Breadth-first collection of every descendant folder id below `rootIds`
 * (exclusive of the roots), scoped to `userId`. When `activeOnly` is true
 * only active folders are traversed (for trashing); otherwise trashed
 * descendants are included too so a restore can revive a whole subtree.
*/
const collectFolderSubtree = async (
  userId: string,
  rootIds: Types.ObjectId[],
  { activeOnly }: { activeOnly: boolean },
): Promise<Types.ObjectId[]> => {
  const stateFilter = activeOnly ? { deletedAt: null } : {};
  const collected = new Map<string, Types.ObjectId>();
  let frontier = [...rootIds];

  while (frontier.length > 0) {
    const batch = frontier;
    frontier = [];

    const children = await Folder.find({
      parentFolderId: { $in: batch },
      userId,
      ...stateFilter,
    })
      .select("_id")
      .lean();

    for (const child of children) {
      const id = child._id as Types.ObjectId;
      const idStr = id.toString();

      if (!collected.has(idStr)) {
        collected.set(idStr, new Types.ObjectId(idStr));
        frontier.push(id);
      }
    }
  }

  return [...collected.values()];
};

const trashItem = async ({ userId, fileId, folderId }: trashItemArgument) => {
  if (!fileId && !folderId)
    throw new ApiError(400, "FolderId aur FileId is required");

  if (fileId) {
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
    const folder = await Folder.findFolderByOwner(userId, folderId);

    if (!folder) {
      throw new ApiError(404, "Folder not found");
    }

    if (folder.deletedAt) {
      throw new ApiError(400, "Folder is already in Trash");
    }

    // Trash the folder together with its entire subtree.
    const folderIdAsObjectId = folder._id as Types.ObjectId;
    const subtree = await collectFolderSubtree(
      userId,
      [folderIdAsObjectId],
      { activeOnly: true },
    );

    await Promise.all([
      Folder.updateMany(
        { _id: { $in: [folderIdAsObjectId, ...subtree] } },
        { deletedAt: new Date() },
      ),
      File.updateMany(
        { parentFolderId: { $in: [folderIdAsObjectId, ...subtree] } },
        { deletedAt: new Date() },
      ),
    ]);
    return;
  }
};

const getTrashedItems = async ({ userId }: { userId: string }) => {
  const [trashedFiles, trashedFolders] = await Promise.all([
    File.find({ userId, deletedAt: { $ne: null } })
      .select("_id name extension size mimeType parentFolderId")
      .lean(),
    Folder.find({ userId, deletedAt: { $ne: null } })
      .select("_id name size parentFolderId")
      .lean(),
  ]);

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

    // Restore the folder together with its entire subtree.
    const folderIdAsObjectId = folder._id as Types.ObjectId;
    const subtree = await collectFolderSubtree(
      userId,
      [folderIdAsObjectId],
      { activeOnly: false },
    );

    await Promise.all([
      Folder.updateMany(
        { _id: { $in: [folderIdAsObjectId, ...subtree] } },
        { deletedAt: null },
      ),
      File.updateMany(
        { parentFolderId: { $in: [folderIdAsObjectId, ...subtree] } },
        { deletedAt: null },
      ),
    ]);
    return;
  }
};

/**
 * Moves many files and folders (with their whole subtrees) to Trash.
 * Items that are already in Trash, do not exist, or belong to another user
 * are skipped silently so a multi-select action never fails mid-batch.
 */
const trashItems = async ({
  userId,
  fileIds,
  folderIds,
}: trashItemsArgument): Promise<{ files: number; folders: number }> => {
  const now = new Date();
  let filesTrashed = 0;
  let foldersTrashed = 0;

  if (fileIds.length > 0) {
    const result = await File.updateMany(
      { _id: { $in: fileIds }, userId, deletedAt: null },
      { $set: { deletedAt: now } },
    );
    filesTrashed = result.modifiedCount;
  }

  if (folderIds.length > 0) {
    const activeRoots = await Folder.find({
      _id: { $in: folderIds },
      userId,
      deletedAt: null,
    })
      .select("_id")
      .lean();

    const rootIds = activeRoots.map((root) => root._id as Types.ObjectId);

    if (rootIds.length > 0) {
      const subtree = await collectFolderSubtree(userId, rootIds, {
        activeOnly: true,
      });
      const allIds = [...rootIds, ...subtree];

      const folderResult = await Folder.updateMany(
        { _id: { $in: allIds }, userId, deletedAt: null },
        { $set: { deletedAt: now } },
      );

      await File.updateMany(
        { parentFolderId: { $in: allIds }, userId, deletedAt: null },
        { $set: { deletedAt: now } },
      );

      foldersTrashed = folderResult.modifiedCount;
    }
  }

  return { files: filesTrashed, folders: foldersTrashed };
};

/**
 * Restores many files and folders (with their whole subtrees) from Trash.
 * Items not in Trash, foreign to the user, or whose name would collide with
 * an active item are skipped silently, so a collision never aborts a batch.
 */
const restoreItems = async ({
  userId,
  fileIds,
  folderIds,
}: trashItemsArgument): Promise<{ files: number; folders: number }> => {
  let filesRestored = 0;
  let foldersRestored = 0;

  for (const fileId of fileIds) {
    const file = await File.findFileByOwner(userId, fileId);

    if (!file || !file.deletedAt) continue;

    const duplicate = await File.exists({
      _id: { $ne: file._id as Types.ObjectId },
      userId: file.userId,
      parentFolderId: file.parentFolderId,
      name: file.name,
      extension: file.extension,
      deletedAt: null,
    });

    if (duplicate) continue;

    await File.updateOne(
      { _id: file._id as Types.ObjectId },
      { deletedAt: null },
    );
    filesRestored++;
  }

  for (const folderId of folderIds) {
    const folder = await Folder.findFolderByOwner(userId, folderId);

    if (!folder || !folder.deletedAt) continue;

    const duplicate = await Folder.exists({
      _id: { $ne: folder._id as Types.ObjectId },
      userId: folder.userId,
      parentFolderId: folder.parentFolderId,
      name: folder.name,
      deletedAt: null,
    });

    if (duplicate) continue;

    const subtree = await collectFolderSubtree(
      userId,
      [folder._id as Types.ObjectId],
      { activeOnly: false },
    );
    const folderIdAsObjectId = folder._id as Types.ObjectId;
    const allIds = [folderIdAsObjectId, ...subtree];

    await Promise.all([
      Folder.updateMany(
        { _id: { $in: allIds }, userId },
        { deletedAt: null },
      ),
      File.updateMany(
        { parentFolderId: { $in: allIds }, userId },
        { deletedAt: null },
      ),
    ]);
    foldersRestored++;
  }

  return { files: filesRestored, folders: foldersRestored };
};

export { trashItem, getTrashedItems, restoreItem, trashItems, restoreItems, permanentDeleteItems, emptyTrash };

/**
 * Permanently deletes the given trashed files and/or folders. A folder is
 * wiped together with its entire subtree (descendant folders + files), and
 * every file's S3 object is removed before its records. Items that are not
 * in the caller's Trash are skipped silently.
 */
const permanentDeleteItems = async ({
  userId,
  itemIds,
}: {
  userId: string;
  itemIds: string[];
}): Promise<{ files: number; folders: number }> => {
  const requestedIds = itemIds.map((id) => new Types.ObjectId(id));

  // Trashed files requested directly.
  const directFiles = await File.find({
    _id: { $in: requestedIds },
    userId,
    deletedAt: { $ne: null },
  })
    .select("_id size parentFolderId")
    .lean();

  // Trashed folders requested directly.
  const trashedRoots = await Folder.find({
    _id: { $in: requestedIds },
    userId,
    deletedAt: { $ne: null },
  })
    .select("_id")
    .lean();

  const rootIds = trashedRoots.map((root) => root._id as Types.ObjectId);
  const subtreeIds = await collectFolderSubtree(userId, rootIds, {
    activeOnly: false,
  });
  const folderIds = [...rootIds, ...subtreeIds];

  // Files living inside the trashed folder subtrees (soft-deleted by cascade).
  const subtreeFiles = await File.find({
    parentFolderId: { $in: folderIds },
    userId,
    deletedAt: { $ne: null },
  })
    .select("_id size parentFolderId")
    .lean();

  const filesToDelete = new Map<
    string,
    { id: string; size: number; parentFolderId: Types.ObjectId }
  >();

  for (const file of [...directFiles, ...subtreeFiles]) {
    filesToDelete.set(file._id.toString(), {
      id: file._id.toString(),
      size: file.size,
      parentFolderId: file.parentFolderId,
    });
  }

  // Delete S3 objects first so a failure never leaves orphan objects; a DB
  // failure afterwards keeps the records, which stay safe to retry.
  for (const fileId of filesToDelete.keys()) {
    await deleteFileObject(fileId);
  }

  if (filesToDelete.size > 0) {
    const files = [...filesToDelete.values()];
    const sizeByParent = new Map<string, number>();

    for (const file of files) {
      const parentId = file.parentFolderId.toString();
      sizeByParent.set(parentId, (sizeByParent.get(parentId) ?? 0) + file.size);
    }

    await Promise.all([
      File.deleteMany({ _id: { $in: files.map((file) => file.id) }, userId }),
      User.updateOne(
        { _id: userId },
        { $inc: { storageUsed: -files.reduce((sum, file) => sum + file.size, 0) } },
      ),
      Folder.bulkWrite(
        [...sizeByParent.entries()].map(([parentFolderId, size]) => ({
          updateOne: {
            filter: { _id: parentFolderId, userId },
            update: { $inc: { size: -size } },
          },
        })),
      ),
    ]);
  }

  if (folderIds.length > 0) {
    await Folder.deleteMany({ _id: { $in: folderIds } });
  }

  if (filesToDelete.size > 0 || folderIds.length > 0) {
    await redisClient.del(getUserProfileCacheKey(userId));
  }

  return { files: filesToDelete.size, folders: folderIds.length };
};

/**
 * Permanently deletes everything currently in the caller's Trash: every
 * trashed file (S3 object + record) and every trashed folder record.
 */
const emptyTrash = async ({
  userId,
}: {
  userId: string;
}): Promise<{ files: number; folders: number }> => {
  const trashedFiles = await File.find({ userId, deletedAt: { $ne: null } })
    .select("_id size parentFolderId")
    .lean();
  const trashedFolders = await Folder.findTrashedFolders(userId);

  for (const file of trashedFiles) {
    const fileId = file._id?.toString();

    if (fileId) {
      await deleteFileObject(fileId);
    }
  }

  const sizeByParent = new Map<string, number>();
  const totalSize = trashedFiles.reduce((sum, file) => {
    const parentId = file.parentFolderId.toString();
    sizeByParent.set(parentId, (sizeByParent.get(parentId) ?? 0) + file.size);
    return sum + file.size;
  }, 0);

  await Promise.all([
    File.deleteMany({ userId, deletedAt: { $ne: null } }),
    Folder.deleteMany({ userId, deletedAt: { $ne: null } }),
    User.updateOne({ _id: userId }, { $inc: { storageUsed: -totalSize } }),
    Folder.bulkWrite(
      [...sizeByParent.entries()].map(([parentFolderId, size]) => ({
        updateOne: {
          filter: { _id: parentFolderId, userId },
          update: { $inc: { size: -size } },
        },
      })),
    ),
  ]);

  if (trashedFiles.length > 0 || trashedFolders.length > 0) {
    await redisClient.del(getUserProfileCacheKey(userId));
  }

  return {
    files: trashedFiles.length,
    folders: trashedFolders.length,
  };
};
