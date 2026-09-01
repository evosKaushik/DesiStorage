import { toast } from "react-toastify";

type ToastData = {
  title: string;
  description: string;
};

const createToastContent = ({ title, description }: ToastData) => {
  if (!title && !description) return null;

  return (
    <div className="flex flex-col gap-0.5">
      {title && <span className="font-semibold">{title}</span>}
      {description && (
        <span className="text-sm">{description}</span>
      )}
    </div>
  );
};

export const showToastWithDescription = {
  success: ({ title, description }: ToastData) => {
    const content = createToastContent({ title, description });
    if (!content) return;

    toast.success(content);
  },

  error: ({ title, description }: ToastData) => {
    const content = createToastContent({ title, description });
    if (!content) return;

    toast.error(content);
  },

  warning: ({ title, description }: ToastData) => {
    const content = createToastContent({ title, description });
    if (!content) return;

    toast.warning(content);
  },

  info: ({ title, description }: ToastData) => {
    const content = createToastContent({ title, description });
    if (!content) return;

    toast.info(content);
  },
};