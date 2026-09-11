export interface PendingUpload {
  userId: string;
  name: string;
  parentId: string;
  expectedSize: number;
  extension: string;
  mimeType: string;
}
