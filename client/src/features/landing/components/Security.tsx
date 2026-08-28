import { CheckCircle2, KeyRound, Lock, ShieldCheck, ServerCog } from "lucide-react";

const POINTS = [
  "AES-256 encryption at rest, TLS 1.3 in transit",
  "Zero-knowledge shared vaults with client-side keys",
  "Data residency in Mumbai, Delhi and Bengaluru regions",
  "SOC 2 Type II, ISO 27001 and GDPR compliant",
  "SSO via Google, Microsoft and SAML 2.0",
  "Point-in-time recovery for 90 days on every file",
];

export function Security() {
  return (
    <section id="security" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Security first
            </p>
            <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Your files, guarded like a bank vault
            </h2>
            <p className="mt-5 text-balance text-lg text-muted-foreground">
              Enterprise-grade security is not an add-on. Every account — free or paid —
              gets the same encryption, the same audits, the same peace of mind.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {POINTS.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 flex-none text-primary" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-xl shadow-primary/5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                  <ShieldCheck className="h-5.5 w-5.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Vault status</p>
                  <p className="text-xs text-muted-foreground">All systems encrypted</p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>

              <div className="mt-6 grid gap-3">
                {[
                  { icon: Lock, label: "AES-256-GCM", value: "Encryption at rest" },
                  { icon: KeyRound, label: "TLS 1.3", value: "Transport" },
                  { icon: ServerCog, label: "ap-south-1", value: "Mumbai region" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 p-3"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <row.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{row.label}</p>
                      <p className="text-xs text-muted-foreground">{row.value}</p>
                    </div>
                    <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">99.99% uptime SLA</p>
                  <p className="text-xs text-muted-foreground">Last 90 days · 0 incidents</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tracking-tight text-primary">99.99%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
