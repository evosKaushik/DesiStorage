import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


const PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    tagline: "A simple place to keep your personal files.",
    cta: "Coming Soon",
    highlight: false,

    features: [
      "500 MB storage",
      "Basic file uploads",
      "File and folder organization",
      "Basic sharing links",
      "Supported file previews",
      "Standard support",
    ],
  },

  {
    name: "Pro",
    price: "Coming soon",
    period: "per user / month",
    tagline: "More space and powerful tools for individuals and small teams.",
    cta: "Coming Soon",
    highlight: true,

    features: [
      "More storage",
      "Larger file uploads",
      "Advanced sharing controls",
      "Password-protected links",
      "Link expiration",
      "Priority support",
    ],
  },

  {
    name: "Business",
    price: "Coming soon",
    period: "per user / month",
    tagline: "Flexible storage and collaboration for growing teams.",
    cta: "Coming Soon",
    highlight: false,

    features: [
      "Higher storage limits",
      "Large file uploads",
      "Team workspaces",
      "Advanced permissions",
      "Admin controls",
      "Activity and audit history",
    ],
  },
];



export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Simple pricing
          </p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Priced in rupees. No surprises.
          </h2>
          <p className="mt-4 text-balance text-lg text-muted-foreground">
            Start free, upgrade when you outgrow it. GST included on every
            invoice.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-3xl border p-7 transition-all",
                plan.highlight
                  ? "border-primary/40 bg-card shadow-2xl shadow-primary/15 lg:-my-4 lg:scale-[1.02]"
                  : "border-border bg-card/60",
              )}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                  Most popular
                </span>
              )}

              <h3 className="text-lg font-semibold text-foreground">
                {plan.name}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {plan.tagline}
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight text-foreground">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {plan.period}
                </span>
              </div>

              <Button
                size="lg"
                variant={plan.highlight ? "default" : "outline"}
                className={cn(
                  "mt-6 h-11",
                  plan.highlight && "shadow-md shadow-primary/20",
                )}
              >
                {plan.cta}
              </Button>

              <div className="my-6 h-px bg-border" />

              <ul className="flex flex-col gap-3">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-foreground"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full",
                        plan.highlight
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Need something custom?{" "}
          <a
            href="#"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Contact sales →
          </a>
        </p>
      </div>
    </section>
  );
}
