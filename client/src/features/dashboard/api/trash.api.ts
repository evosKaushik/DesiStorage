import { apiRequest } from "@/utils/api";
import { axiosInstance } from "@/utils/axiosInstance";

export interface TrashedFileView {
  id: string;
  name: string;
  extension: string;
  size: number;
  mimeType: string;
  parentFolderId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 204 no-body endpoints bypass the JSON envelope, so they use a dedicated
 * helper instead of `apiRequest` (which expects `{ success, message, data }`).
 */
const requestNoContent = async (
  method: "post" | "delete",
  url: string,
): Promise<boolean> => {
  try {
    await axiosInstance[method](url);
    return true;
  } catch {
    return false;
  }
};

const getTrashedFilesApi = () =>
  apiRequest<{ files: TrashedFileView[] }>("GET", "/files/trashed");

const moveToTrashApi = (fileId: string) =>
  requestNoContent("post", `/files/${fileId}/trash`);

const restoreFileApi = (fileId: string) =>
  requestNoContent("post", `/files/${fileId}/restore`);

const deleteFilePermanentlyApi = (fileId: string) =>
  requestNoContent("delete", `/files/${fileId}/permanent`);

const emptyTrashApi = () => requestNoContent("delete", "/files/trashed");

export {
  deleteFilePermanentlyApi,
  emptyTrashApi,
  getTrashedFilesApi,
  moveToTrashApi,
  restoreFileApi,
};