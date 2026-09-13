import DialogWithInput from "@/components/DialogWithInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import useFileSystemStore from "@/store/useFileSystemStore";

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
import { useState } from "react";
import useTrashStore from "@/store/useTrashStore";

const FileItemContentBody = ({
  onRename,
  onTrash,
}: {
  onRename: () => void;
  onTrash?: () => void;
}) => {
    return (
    <>
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

      <DropdownMenuItem onClick={onRename}>
        <Pencil className="mr-2 h-4 w-4" />
        Rename
        <span className="ml-auto text-xs text-muted-foreground">
          Ctrl+Alt+E
        </span>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

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

      <DropdownMenuItem
        onClick={onTrash}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Move to trash
        <span className="ml-auto text-xs">Delete</span>
      </DropdownMenuItem>
    </>
  );
};

const FileItemContextMenu = ({
  selectedItemId,
  selectedItemName,
  selectedItemKind = "file",
}: {
  selectedItemId: string;
  selectedItemName: string;
  selectedItemKind?: "file" | "folder";
}) => {
  const renameItem = useFileSystemStore((state) => state.renameItem);
  const moveToTrash = useTrashStore((state) => state.moveToTrash);

  const [renameOpen, setRenameOpen] = useState(false);

  const onTrash = () => {
    void moveToTrash(selectedItemId, selectedItemKind);
  };

  const onFileRenameSubmit = async (newName: string) => {
    await renameItem(selectedItemId, newName, selectedItemKind);
    setRenameOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          onClick={(e) => e.stopPropagation()}
          aria-label="Folder actions"
          className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 data-[popup-open]:bg-muted data-[popup-open]:text-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <FileItemContentBody
            onRename={() => setRenameOpen(true)}
            onTrash={onTrash}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogWithInput
        title="Rename"
        defaultValue={selectedItemName}
        placeholder="Enter new name"
        open={renameOpen}
        onOpenChange={setRenameOpen}
        onSubmit={(newName) => void onFileRenameSubmit(newName)}
      />
    </>
  );
};

export default FileItemContextMenu;
export { FileItemContentBody };
