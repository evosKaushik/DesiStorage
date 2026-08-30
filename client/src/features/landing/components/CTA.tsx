import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="relative px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary via-primary to-primary-glow px-6 py-16 text-center shadow-2xl shadow-primary/25 sm:px-12 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-grid opacity-15"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-white/20 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <h2 className="text-balance text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
            Your files deserve a better home.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-primary-foreground/85">
            Start with 500 MB free. Upgrade when you love it. Cancel anytime.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 gap-2 bg-background px-6 text-base text-foreground shadow-lg hover:bg-background/90"
            >
              Coming Soon
              <ArrowRight className="h-4 w-4" />
            </Button>
            {/* <Button
              size="lg"
              variant="outline"
              className="h-12 border-primary-foreground/30 bg-transparent px-6 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              Try Free Trail
            </Button> */}
          </div>
        </div>
      </div>
    </section>
  );
}
