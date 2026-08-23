export type FileKind =
  | "folder"
  | "image"
  | "doc"
  | "sheet"
  | "video"
  | "audio"
  | "zip"
  | "pdf";
export interface FileRow  {
  id: string;
  name: string;
  kind: FileKind;
  size: string;
  modified: string;
  owner: string;
  shared?: boolean;
  starred?: boolean;
  color?: string;
};

export interface ShareLink {
  id: string;
  name: string;
  kind: FileKind;
  url: string;
  access: "Anyone with link" | "Team only" | "Password protected";
  views: number;
  expires: string;
}
