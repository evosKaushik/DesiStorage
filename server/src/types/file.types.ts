export interface PendingUpload {
  userId: string;
  key: string;
  name: string;
  extension: string;
  size: number;
  mimeType: string;
  parentId: string;
}