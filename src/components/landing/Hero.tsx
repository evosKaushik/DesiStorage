import { ArrowRight, Play, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";



export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-grid [mask-image:radial-gradient(60%_50%_at_50%_20%,black,transparent)]" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-2 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Now with AI-powered file search
            <span className="mx-1 h-3 w-px bg-border" />
            <span className="text-foreground">Try it →</span>
          </div>

          <h1 className="mt-6 text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl">
            Cloud storage,{" "}
            <span className="bg-gradient-to-r from-primary via-primary to-primary-glow bg-clip-text text-transparent">
              made for Bharat.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-4xl text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Upload, organize, share and preview every file in one beautifully fast workspace.
            End-to-end encrypted. Priced in rupees. Built for teams that ship.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="h-12 gap-2 px-6 text-base shadow-lg shadow-primary/20">
              Start free — 15 GB
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 gap-2 border-border bg-background/60 px-6 text-base backdrop-blur"
            >
              <Play className="h-4 w-4 fill-current" />
              Watch 90-sec demo
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              SOC 2 · ISO 27001
            </span>
            <span>No credit card required</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}
