import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  MoreVertical,
  Pencil,
  Share2,
  Download,
  Trash2,
  InfoIcon,
  MoveIcon,
  EyeIcon,
  SquareArrowOutUpRightIcon,
  FileTextIcon,
  UserPlusIcon,
  Link2Icon,
} from "lucide-react";

const FileItemContentBody = () => {
  return  <>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <MoveIcon className="mr-2 h-4 w-4" />
        Open
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuItem>
            <EyeIcon className="mr-2 h-4 w-4" />
            Preview
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SquareArrowOutUpRightIcon className="mr-2 h-4 w-4" />
            Open in new tab
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <FileTextIcon className="mr-2 h-4 w-4" />
            Open in Google Docs
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>

    <DropdownMenuItem>
      <Pencil className="mr-2 h-4 w-4" />
      Rename
      <span className="ml-auto text-xs text-muted-foreground">Ctrl+Alt+E</span>
    </DropdownMenuItem>

    <DropdownMenuSeparator />

    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuItem>
            <UserPlusIcon className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link2Icon className="mr-2 h-4 w-4" />
            Copy link
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>

    <DropdownMenuItem>
      <Download className="mr-2 h-4 w-4" />
      Download
    </DropdownMenuItem>

    <DropdownMenuItem>
      <InfoIcon className="mr-2 h-4 w-4" />
      Folder information
    </DropdownMenuItem>

    <DropdownMenuSeparator />

    <DropdownMenuItem className="text-destructive focus:text-destructive">
      <Trash2 className="mr-2 h-4 w-4" />
      Move to trash
      <span className="ml-auto text-xs">Delete</span>
    </DropdownMenuItem>
  </>;
};

const FileItemContextMenu = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(e) => e.stopPropagation()}
        aria-label="Folder actions"
        className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 data-[popup-open]:bg-muted data-[popup-open]:text-foreground"
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <FileItemContentBody />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FileItemContextMenu;
export { FileItemContentBody };