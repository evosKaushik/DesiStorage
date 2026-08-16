"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Download,
  FileText,
  Film,
  Folder,
  Image as ImageIcon,
  Link2,
  MoreHorizontal,
  Music,
  Search,
  Share2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DemoState = "upload" | "drop" | "preview";

const STATES: { id: DemoState; label: string; icon: typeof Upload }[] = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "drop", label: "Drag & drop", icon: Folder },
  { id: "preview", label: "Preview", icon: ImageIcon },
];

const AUTO_MS = 5200;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export function InteractiveDemo() {
  const [active, setActive] = useState<DemoState>("upload");
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  const [cycle, setCycle] = useState(0); // bumps to restart child anims on re-enter
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (paused || reduced) return;
    const t = window.setInterval(() => {
      const idx = STATES.findIndex((s) => s.id === activeRef.current);
      const next = STATES[(idx + 1) % STATES.length].id;
      setActive(next);
      setCycle((c) => c + 1);
    }, AUTO_MS);
    return () => window.clearInterval(t);
  }, [paused, reduced]);

  const handleTab = (id: string) => {
    setActive(id as DemoState);
    setCycle((c) => c + 1);
  };

  return (
    <section
      id="demo"
      className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:py-32"
      aria-labelledby="demo-heading"
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[420px] max-w-4xl"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 20%, rgba(37,99,235,0.18), rgba(56,189,248,0.06) 45%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
          </span>
          Live product preview
        </span>
        <h2
          id="demo-heading"
          className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl"
        >
          Every file, every workflow, one workspace.
        </h2>
        <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
          Upload, organize, and preview anything — instantly. Explore the three
          moments that make DesiStorage feel effortless.
        </p>
      </div>

      <div className="mt-10 flex items-center justify-center">
        <Tabs value={active} onValueChange={handleTab}>
          <TabsList className="h-11 rounded-full bg-muted/60 p-1 backdrop-blur">
            {STATES.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="gap-2 rounded-full px-4 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div
        className="mt-10"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <DemoFrame active={active} cycle={cycle} />
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {STATES.map((s, i) => {
          const isActive = s.id === active;
          return (
            <button
              key={s.id}
              onClick={() => handleTab(s.id)}
              aria-label={`Show ${s.label} demo`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                isActive
                  ? "w-8 bg-primary"
                  : "w-4 bg-muted-foreground/30 hover:bg-muted-foreground/50",
              )}
              style={
                isActive && !paused && !reduced
                  ? {
                      animation: `demo-progress ${AUTO_MS}ms linear`,
                      backgroundImage:
                        "linear-gradient(90deg, hsl(var(--primary, 221 83% 53%)) 50%, rgba(148,163,184,0.35) 50%)",
                      backgroundSize: "200% 100%",
                    }
                  : undefined
              }
            />
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 App Chrome                                 */
/* -------------------------------------------------------------------------- */

function DemoFrame({ active, cycle }: { active: DemoState; cycle: number }) {
  return (
    <div className="relative rounded-3xl bg-gradient-to-b from-slate-200/60 via-slate-200/20 to-transparent p-px shadow-[0_40px_120px_-30px_rgba(15,23,42,0.35)] dark:from-white/10 dark:via-white/[0.04]">
      <div className="overflow-hidden rounded-[calc(theme(borderRadius.3xl)-1px)] border border-border/60 bg-background">
        {/* Window bar */}
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <div className="mx-auto flex h-6 max-w-sm flex-1 items-center gap-2 rounded-md bg-background/70 px-3 text-[11px] text-muted-foreground ring-1 ring-inset ring-border/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            app.desistorage.com / Workspace / Marketing
          </div>
        </div>

        {/* Body */}
        <div className="grid min-h-[440px] grid-cols-[56px_1fr] md:grid-cols-[220px_1fr]">
          <Sidebar />
          <div className="flex flex-col">
            <Toolbar active={active} />
            <div className="relative flex-1 overflow-hidden bg-gradient-to-b from-background to-muted/20">
              <div
                key={`${active}-${cycle}`}
                className="animate-in fade-in-0 slide-in-from-bottom-1 duration-500"
              >
                {active === "upload" && <UploadPane cycle={cycle} />}
                {active === "drop" && <DropPane cycle={cycle} />}
                {active === "preview" && <PreviewPane cycle={cycle} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  const items = [
    { icon: Folder, label: "My files", active: true, count: "128" },
    { icon: Users, label: "Shared", count: "24" },
    { icon: Upload, label: "Recents" },
    { icon: ImageIcon, label: "Media" },
    { icon: FileText, label: "Documents" },
  ];
  return (
    <aside className="hidden border-r border-border/60 bg-muted/20 p-3 md:block">
      <div className="mb-4 flex items-center gap-2 px-2 py-1.5">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
          <Folder className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold">Marketing</div>
          <div className="truncate text-[10px] text-muted-foreground">
            12 members
          </div>
        </div>
      </div>
      <nav className="space-y-0.5">
        {items.map((it) => (
          <div
            key={it.label}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
              it.active
                ? "bg-background text-foreground shadow-sm ring-1 ring-inset ring-border/60"
                : "text-muted-foreground hover:bg-muted/60",
            )}
          >
            <it.icon className="h-3.5 w-3.5" />
            <span className="flex-1 truncate">{it.label}</span>
            {it.count && (
              <span className="text-[10px] text-muted-foreground">
                {it.count}
              </span>
            )}
          </div>
        ))}
      </nav>
      <div className="mt-6 rounded-md border border-border/60 bg-background p-2.5">
        <div className="mb-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Storage</span>
          <span>48.2 / 100 GB</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-sky-400"
            style={{ width: "48%" }}
          />
        </div>
      </div>
    </aside>
  );
}

function Toolbar({ active }: { active: DemoState }) {
  const crumb =
    active === "upload"
      ? "Q4 Launch"
      : active === "drop"
        ? "Q4 Launch / Assets"
        : "Q4 Launch / Assets / hero-banner.png";
  return (
    <div className="flex items-center gap-2 border-b border-border/60 bg-background/60 px-4 py-2.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Folder className="h-3.5 w-3.5" />
        <span className="text-foreground">{crumb}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-1.5 rounded-md border border-border/60 bg-background px-2 py-1 text-[11px] text-muted-foreground sm:flex">
          <Search className="h-3 w-3" />
          Search files
          <kbd className="ml-2 rounded border border-border/60 bg-muted px-1 text-[9px]">
            ⌘K
          </kbd>
        </div>
        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-sky-400 to-primary ring-2 ring-background" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Upload Pane                                 */
/* -------------------------------------------------------------------------- */

type UploadFile = {
  name: string;
  size: string;
  kind: "img" | "vid" | "doc" | "aud";
  delay: number;
  duration: number;
};

const UPLOAD_FILES: UploadFile[] = [
  {
    name: "hero-banner.png",
    size: "4.2 MB",
    kind: "img",
    delay: 0,
    duration: 1800,
  },
  {
    name: "brand-guidelines.pdf",
    size: "12.8 MB",
    kind: "doc",
    delay: 500,
    duration: 2400,
  },
  {
    name: "product-tour.mp4",
    size: "48.1 MB",
    kind: "vid",
    delay: 1100,
    duration: 3200,
  },
  {
    name: "podcast-intro.mp3",
    size: "3.6 MB",
    kind: "aud",
    delay: 1800,
    duration: 1600,
  },
];

function UploadPane({ cycle }: { cycle: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[1fr_260px]">
      <div className="rounded-xl border border-dashed border-primary/40 bg-primary/[0.03] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium">Uploading 4 files</div>
              <div className="text-[11px] text-muted-foreground">
                68.7 MB · Encrypting in transit
              </div>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="h-7 text-xs">
            Cancel all
          </Button>
        </div>
        <div className="space-y-2">
          {UPLOAD_FILES.map((f, i) => (
            <UploadRow key={`${cycle}-${i}`} file={f} />
          ))}
        </div>
      </div>

      <div className="hidden flex-col gap-3 lg:flex">
        <StatCard label="Uploaded today" value="238" delta="+42" />
        <StatCard label="Avg speed" value="184 MB/s" delta="+12%" />
        <StatCard label="Success rate" value="99.98%" delta="30d" muted />
      </div>
    </div>
  );
}

function UploadRow({ file }: { file: UploadFile }) {
  return (
    <div
      className="group flex items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2.5"
      style={{ animationDelay: `${file.delay}ms` }}
    >
      <FileIcon kind={file.kind} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="truncate text-xs font-medium">{file.name}</div>
          <div className="shrink-0 text-[10px] text-muted-foreground">
            {file.size}
          </div>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-sky-400"
            style={{
              animation: `demo-progress-fill ${file.duration}ms cubic-bezier(.2,.7,.2,1) ${file.delay}ms both`,
            }}
          />
        </div>
      </div>
      <span
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 opacity-0 dark:text-emerald-400"
        style={{
          animation: `demo-check 300ms ease-out ${file.delay + file.duration}ms both`,
        }}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Drop Pane                                 */
/* -------------------------------------------------------------------------- */

const DROP_FILES = [
  { name: "moodboard.jpg", kind: "img" as const, size: "2.1 MB" },
  { name: "concept.fig", kind: "doc" as const, size: "18 MB" },
  { name: "voiceover.mp3", kind: "aud" as const, size: "5.4 MB" },
  { name: "teaser.mp4", kind: "vid" as const, size: "62 MB" },
  { name: "notes.md", kind: "doc" as const, size: "12 KB" },
  { name: "cover.png", kind: "img" as const, size: "3.8 MB" },
];

function DropPane({ cycle }: { cycle: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[280px_1fr]">
      {/* Dragging folder */}
      <div className="relative flex items-center justify-center">
        <div
          className="pointer-events-none absolute z-10"
          style={{
            animation: `demo-drag 2600ms cubic-bezier(.2,.7,.2,1) both`,
          }}
          key={`drag-${cycle}`}
        >
          <div className="flex items-center gap-2.5 rounded-xl border border-primary/40 bg-background px-3.5 py-2.5 shadow-2xl ring-2 ring-primary/20">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Folder className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold">Campaign assets</div>
              <div className="text-[10px] text-muted-foreground">
                6 items · 91.4 MB
              </div>
            </div>
            <div className="ml-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              6
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/30 p-6 opacity-70">
          <Folder className="h-16 w-16 text-muted-foreground/50" />
        </div>
      </div>

      {/* Drop zone → grid */}
      <div
        key={`zone-${cycle}`}
        className="relative min-h-[320px] overflow-hidden rounded-xl border-2 border-dashed border-primary/40 bg-primary/[0.03]"
        style={{
          animation: `demo-drop-pulse 2600ms ease-out both`,
        }}
      >
        <div
          className="absolute inset-0 grid place-items-center text-xs text-primary/80"
          style={{
            animation: `demo-fade-out 400ms ease-out 2200ms both`,
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10">
              <Upload className="h-4 w-4" />
            </div>
            <div className="font-medium">Drop to add to Assets</div>
            <div className="text-[10px] text-muted-foreground">
              Folder structure will be preserved
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 p-3">
          {DROP_FILES.map((f, i) => (
            <div
              key={`${cycle}-${i}`}
              className="group flex flex-col gap-2 rounded-lg border border-border/60 bg-background p-2.5 opacity-0"
              style={{
                animation: `demo-stagger-in 420ms cubic-bezier(.2,.7,.2,1) ${2400 + i * 70}ms both`,
              }}
            >
              <div className="grid aspect-[4/3] place-items-center rounded-md bg-muted/60">
                <FileIcon kind={f.kind} large />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[11px] font-medium">{f.name}</div>
                <div className="text-[9px] text-muted-foreground">{f.size}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Preview Pane                                */
/* -------------------------------------------------------------------------- */

function PreviewPane({ cycle }: { cycle: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[1fr_320px]">
      {/* File list */}
      <div className="space-y-1">
        {[
          {
            name: "hero-banner.png",
            kind: "img" as const,
            size: "4.2 MB",
            mod: "2m ago",
            selected: true,
          },
          {
            name: "brand-guidelines.pdf",
            kind: "doc" as const,
            size: "12.8 MB",
            mod: "1h ago",
          },
          {
            name: "product-tour.mp4",
            kind: "vid" as const,
            size: "48.1 MB",
            mod: "3h ago",
          },
          {
            name: "podcast-intro.mp3",
            kind: "aud" as const,
            size: "3.6 MB",
            mod: "yesterday",
          },
          {
            name: "moodboard.jpg",
            kind: "img" as const,
            size: "2.1 MB",
            mod: "yesterday",
          },
        ].map((f) => (
          <div
            key={f.name}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-xs",
              f.selected
                ? "bg-primary/10 ring-1 ring-inset ring-primary/30"
                : "hover:bg-muted/60",
            )}
          >
            <FileIcon kind={f.kind} />
            <span className="flex-1 truncate font-medium">{f.name}</span>
            <span className="hidden text-[10px] text-muted-foreground sm:inline">
              {f.mod}
            </span>
            <span className="w-16 shrink-0 text-right text-[10px] text-muted-foreground">
              {f.size}
            </span>
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        ))}
      </div>

      {/* Preview panel */}
      <div
        key={`preview-${cycle}`}
        className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-background shadow-lg"
        style={{
          animation: `demo-preview-in 450ms cubic-bezier(.2,.7,.2,1) both`,
        }}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-sky-500 via-primary to-indigo-600">
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 40%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.25), transparent 45%)",
            }}
          />
          <div className="absolute bottom-3 left-3 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
            2400 × 1200 · PNG
          </div>
          <button className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md bg-black/40 text-white backdrop-blur hover:bg-black/60">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <div>
            <div className="truncate text-sm font-semibold">
              hero-banner.png
            </div>
            <div className="text-[11px] text-muted-foreground">
              Modified 2 minutes ago · by Aarav
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="rounded-md bg-muted/60 py-1.5">
              <div className="font-semibold text-foreground">v4</div>
              <div className="text-muted-foreground">Version</div>
            </div>
            <div className="rounded-md bg-muted/60 py-1.5">
              <div className="font-semibold text-foreground">128</div>
              <div className="text-muted-foreground">Views</div>
            </div>
            <div className="rounded-md bg-muted/60 py-1.5">
              <div className="font-semibold text-foreground">7</div>
              <div className="text-muted-foreground">Shared</div>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="h-8 flex-1 text-xs">
              <Share2 className="mr-1.5 h-3 w-3" /> Share
            </Button>
            <Button size="sm" variant="outline" className="h-8 flex-1 text-xs">
              <Link2 className="mr-1.5 h-3 w-3" /> Copy link
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Bits                                     */
/* -------------------------------------------------------------------------- */

function FileIcon({
  kind,
  large,
}: {
  kind: "img" | "vid" | "doc" | "aud";
  large?: boolean;
}) {
  const map = {
    img: { Icon: ImageIcon, color: "text-emerald-500 bg-emerald-500/10" },
    vid: { Icon: Film, color: "text-rose-500 bg-rose-500/10" },
    doc: { Icon: FileText, color: "text-sky-500 bg-sky-500/10" },
    aud: { Icon: Music, color: "text-violet-500 bg-violet-500/10" },
  } as const;
  const { Icon, color } = map[kind];
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-md",
        color,
        large ? "h-9 w-9" : "h-7 w-7",
      )}
    >
      <Icon className={large ? "h-4 w-4" : "h-3.5 w-3.5"} />
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  muted,
}: {
  label: string;
  value: string;
  delta: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
      <div
        className={cn(
          "mt-0.5 text-[10px]",
          muted
            ? "text-muted-foreground"
            : "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {delta}
      </div>
    </div>
  );
}
