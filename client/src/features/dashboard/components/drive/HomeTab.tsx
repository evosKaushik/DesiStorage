import { Home, HardDrive, TrendingUp, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileCard } from "./FileCard";
import { FILES } from "@/features/dashboard/data/dashboard";
import useUserStore, { selectUser } from "@/store/useUserStore";
import UseStorageDetails from "@/hooks/useStorageDetails";

export function HomeTab({
  setSelected,
}: {
  setSelected: (id: string | null) => void;
}) {
  const user = useUserStore(selectUser);

  const { formattedStorageLimit, formattedStorageUsed, percentageUsed } =
    UseStorageDetails(user?.storageUsed, user?.storageLimit);
  const suggestions = FILES.slice(0, 4);
  return (
    <>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Home className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">Home</span>
      </div>
      <div className="mt-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, Arjun
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening across your workspace today.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={HardDrive}
          label="Storage used"
          value={formattedStorageUsed.toString()}
          hint={`of ${formattedStorageLimit} ${percentageUsed}%`}
        />
        <StatCard
          icon={TrendingUp}
          label="Uploads this week"
          value="42"
          hint="+18% vs last week"
          tone="emerald"
        />
        <StatCard
          icon={Users}
          label="Active collaborators"
          value="14"
          hint="4 online now"
          tone="violet"
        />
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Suggested for you
          </h2>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> AI picks
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {suggestions.map((f) => (
            <FileCard
              key={f.id}
              file={f}
              active={false}
              onClick={() => setSelected(f.id)}
            />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Activity
        </h2>
        <div className="rounded-2xl border border-border/60 bg-card">
          {[
            {
              who: "Priya S.",
              what: "commented on Investor-deck.pdf",
              when: "12m ago",
            },
            {
              who: "Ananya P.",
              what: "shared Design System with your team",
              when: "1h ago",
            },
            { who: "You", what: "uploaded Hero-banner-v3.png", when: "2h ago" },
            {
              who: "Rahul K.",
              what: "restored Sprint-demo.mp4 from trash",
              when: "Yesterday",
            },
          ].map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-border/50 px-4 py-3 last:border-0"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {a.who.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-sm">
                <span className="font-semibold">{a.who}</span>{" "}
                <span className="text-muted-foreground">{a.what}</span>
              </div>
              <span className="text-xs text-muted-foreground">{a.when}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: typeof Home;
  label: string;
  value: string;
  hint: string;
  tone?: "primary" | "emerald" | "violet";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  };
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-xl",
          tones[tone],
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
