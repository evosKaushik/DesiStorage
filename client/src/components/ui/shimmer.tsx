import { cn } from "@/lib/utils";

function Shimmer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="shimmer"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
    </div>
  );
}

export { Shimmer };
