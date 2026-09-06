import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";

interface DialogWithInputProps {
  title: string;
  defaultValue?: string;
  placeholder?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: string) => void;
  onCancel?: () => void;
}

const DialogWithInput = ({
  title,
  defaultValue = "",
  placeholder,
  open,
  onOpenChange,
  onSubmit,
  onCancel,
}: DialogWithInputProps) => {
  const [value, setValue] = useState(defaultValue);

  // Reset input whenever the dialog opens
  useEffect(() => {
    if (open) {
      setValue(defaultValue);
    }
  }, [open, defaultValue]);

  const handleSubmit = () => {
    onSubmit(value);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
    onCancel?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-94 max-w-[calc(100%-2rem)] rounded-[28px] p-7"
      >
        <DialogHeader className="gap-5">
          <DialogTitle className="text-2xl font-normal leading-none">
            {title}
          </DialogTitle>

          <Input
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            className="h-12 rounded-sm border-2 px-4 text-xl focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </DialogHeader>

        <DialogFooter className="flex flex-row justify-end gap-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>

          <Button type="button" onClick={handleSubmit}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DialogWithInput;