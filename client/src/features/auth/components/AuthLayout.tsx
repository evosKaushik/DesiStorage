import type { ReactNode } from "react";
import { ShieldCheck, Zap, Globe2, Quote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../../../components/ui/button";

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

export function SocialAuthButtons({ label }: { label: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Button variant="outline">
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.6a5.7 5.7 0 0 1-2.4 3.7v3h3.8c2.3-2.1 3.5-5.2 3.5-8.6Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-3c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5H1.3v3.1A12 12 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.2 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l3.9-3.1Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.8c1.8 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l3.9 3.1c1-2.9 3.7-4.9 6.8-4.9Z"
          />
        </svg>
        {label} Google
      </Button>
      <Button variant="outline">
        <svg
          className="h-4 w-4 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.04-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.22 0 1.61-.01 2.91-.01 3.3 0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
        </svg>
        {label} Apple
      </Button>
    </div>
  );
}
