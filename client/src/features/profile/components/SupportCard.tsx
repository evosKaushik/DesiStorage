import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SupportCard({
  icon: Icon,
  title,
  desc,
  cta,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="mt-3 text-sm font-semibold">{title}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
      <Button variant="outline" size="sm" className="mt-4 w-full">
        {cta}
      </Button>
    </div>
  );
}
