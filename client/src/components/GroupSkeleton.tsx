import { Shimmer } from "@/components/ui/shimmer";

export function GroupSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="divide-y divide-border/60">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 py-4">
          <Shimmer className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Shimmer className="h-4 w-1/3" />
            <Shimmer className="h-3 w-1/2" />
            <Shimmer className="h-3 w-2/3" />
          </div>
          <Shimmer className="h-8 w-16 shrink-0 rounded-md" />
        </li>
      ))}
    </ul>
  );
}
