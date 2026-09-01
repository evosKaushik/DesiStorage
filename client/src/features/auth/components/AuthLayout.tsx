import type { ReactNode } from "react";
import { ShieldCheck, Zap, Globe2, Quote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: "End-to-end encrypted",
    desc: "AES-256 at rest, TLS 1.3 in transit. Keys you control.",
  },
  {
    icon: Zap,
    title: "Blazing fast transfers",
    desc: "Parallel multipart uploads with resume support.",
  },
  {
    icon: Globe2,
    title: "Data stays in India",
    desc: "Mumbai region residency with DPDP-ready compliance.",
  },
];

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="relative flex flex-col px-5 py-6 sm:px-10 lg:px-14">
        <Link href="/" className="flex items-center gap-2">
          <span className="relative h-8 w-8 xs:h-12 xs:w-12 overflow-hidden rounded-full bg-white shadow-sm">
            <Image
              src="/logo.png"
              alt="Logo"
              fill
              sizes="(max-width: 375px) 32px, 48px"
              className="object-contain"
            />
          </span>

          <h2 className="xs:text-lg font-semibold tracking-tight text-foreground">
            <span className="text-secondary-foreground">Desi</span>
            <span className="text-primary">Storage</span>
          </h2>
        </Link>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-4">
          <span className="mb-3 inline-flex w-fit items-center rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            {eyebrow}
          </span>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-foreground sm:text-[32px]">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>

        <div className="mx-auto w-full max-w-[420px] text-sm text-muted-foreground">
          {footer}
        </div>
      </div>

      {/* Brand side */}
      <div className="relative hidden overflow-hidden border-l border-border/60 bg-muted/30 lg:block">
        <div className="pointer-events-none absolute -left-24 top-[-10%] h-[420px] w-[420px] rounded-full bg-primary/25 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-[-15%] right-[-10%] h-[460px] w-[460px] rounded-full bg-primary/15 blur-[130px]" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <div>
            <h2 className="max-w-md text-[26px] font-semibold leading-snug tracking-tight text-foreground">
              The storage workspace teams across Bharat actually enjoy using.
            </h2>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Trusted by 12,000+ teams to upload, preview, share and secure
              their most important files.
            </p>

            <div className="mt-10 space-y-4">
              {HIGHLIGHTS.map((h) => (
                <div
                  key={h.title}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 backdrop-blur-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <h.icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {h.title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {h.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <figure className="rounded-2xl border border-border/60 bg-background/70 p-6 backdrop-blur-sm">
            <Quote className="h-5 w-5 text-primary" />
            <blockquote className="mt-3 text-sm leading-relaxed text-foreground">
              “We moved 4TB of design assets in a weekend. Sharing links with
              clients finally feels effortless — and everything stays in India.”
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                AK
              </span>
              <span className="text-sm">
                <span className="block font-medium text-foreground">
                  Ananya Kulkarni
                </span>
                <span className="block text-muted-foreground">
                  Head of Design, Zomato
                </span>
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}
