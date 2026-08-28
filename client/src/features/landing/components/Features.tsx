import {
  Cloud,
  FolderTree,
  Lock,
  Search,
  Share2,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: Cloud,
    title: "Fast, resumable uploads",
    desc: "Upload large files with resumable transfers designed to stay reliable across different network conditions.",
  },
  {
    icon: FolderTree,
    title: "Organize your way",
    desc: "Create folders, move files, and keep your workspace neatly organized as your storage grows.",
  },
  {
    icon: Search,
    title: "Find files faster",
    desc: "Search across your files and folders to quickly find what you need.",
  },
  {
    icon: Share2,
    title: "Simple file sharing",
    desc: "Create secure sharing links with access controls and expiration settings.",
  },
  {
    icon: Lock,
    title: "Encrypted storage",
    desc: "Your files are protected with encryption in transit and at rest, alongside controlled access.",
  },
  {
    icon: Users,
    title: "Private workspaces",
    desc: "Keep your personal files organized in a workspace designed around your account and permissions.",
  },
  {
    icon: Sparkles,
    title: "Smart file experience",
    desc: "Preview supported files, manage your storage, and access your content from one clean workspace.",
  },
  {
    icon: Zap,
    title: "Built for speed",
    desc: "A responsive storage experience designed for uploading, organizing, sharing, and accessing files quickly.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Everything you need
          </p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            A workspace as fast as your team
          </h2>
          <p className="mt-4 text-balance text-lg text-muted-foreground">
            Every feature built with obsession — designed to disappear so you
            can just work.
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative flex flex-col gap-4 bg-card p-6 transition-colors hover:bg-accent/40"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
