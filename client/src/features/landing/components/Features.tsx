

import gsap from "gsap";
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
import { useRef } from "react";

const FEATURES = [
  {
    icon: Cloud,
    title: "Unlimited uploads",
    desc: "Drop files up to 5 GB each. Resumable, parallel, and blazing fast on any network.",
  },
  {
    icon: FolderTree,
    title: "Real folder structure",
    desc: "Nest folders, drag to move, colour-code projects. It behaves like Finder — because it should.",
  },
  {
    icon: Search,
    title: "AI search that works",
    desc: "Ask “Q3 pitch deck” or “vendor invoices in March.” We find it, even inside PDFs and images.",
  },
  {
    icon: Share2,
    title: "Share with anyone",
    desc: "Password-protected links, expiry dates, download limits and viewer analytics — built in.",
  },
  {
    icon: Users,
    title: "Team spaces",
    desc: "Roles, granular permissions, and an activity log that keeps everyone honest.",
  },
  {
    icon: Lock,
    title: "End-to-end encrypted",
    desc: "AES-256 at rest, TLS 1.3 in transit, zero-knowledge on shared vaults. Your files, your keys.",
  },
  {
    icon: Zap,
    title: "Instant previews",
    desc: "Preview 200+ file types — from RAW photos to Figma exports — without downloading a byte.",
  },
  {
    icon: Sparkles,
    title: "Automations",
    desc: "Auto-tag, auto-organize, auto-share. Rules that run in the background, so you don’t have to.",
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
