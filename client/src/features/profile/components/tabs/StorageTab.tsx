import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { SectionCard } from "../SectionCard";
import useUserStore, { selectUser } from "@/store/useUserStore";
import UseStorageDetails from "@/hooks/useStorageDetails";

const STORAGE_BREAKDOWN = [
  {
    label: "Photos & videos",
    value: "58 GB",
    pct: 45,
    tone: "bg-blue-500",
  },
  { label: "Documents", value: "32 GB", pct: 25, tone: "bg-violet-500" },
  { label: "Archives", value: "24 GB", pct: 19, tone: "bg-emerald-500" },
  { label: "Other", value: "14 GB", pct: 11, tone: "bg-amber-500" },
];

export function StorageTab() {
  const user = useUserStore(selectUser);

  const { formattedStorageLimit, formattedStorageUsed, percentageUsed } =
    UseStorageDetails(user?.storageUsed, user?.storageLimit);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Storage usage"
        description={`${formattedStorageUsed} of ${formattedStorageLimit} used across your workspace.`}
      >
        <Progress value={64} className="h-2" />
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {formattedStorageUsed} free
          </span>
          <span className="font-semibold">{percentageUsed}%</span>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STORAGE_BREAKDOWN.map((b) => (
            <div
              key={b.label}
              className="rounded-xl border border-border/60 p-3"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn("h-2 w-2 rounded-full", b.tone)} />{" "}
                {b.label}
              </div>
              <div className="mt-1 text-lg font-semibold">{b.value}</div>
              <div className="text-xs text-muted-foreground">
                {b.pct}% of total
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Current plan"
        description="Pro · billed annually"
        right={
          <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
            Active
          </Badge>
        }
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-3xl font-semibold">
              ₹499
              <span className="text-base font-normal text-muted-foreground">
                /mo
              </span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Next invoice on 12 Aug 2026 · ₹5,988 total
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <CreditCard className="mr-2 h-4 w-4" /> Invoices
            </Button>
            <Button>Upgrade plan</Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
