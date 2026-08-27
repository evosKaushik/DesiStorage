"use client";

import { SiteNav } from "@/components/landing/SiteNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileQuestion, Home, Search } from "lucide-react";
import Link from "next/link";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <SiteNav />
      <main className="relative flex min-h-screen   items-center justify-center overflow-hidden px-4 pt-16">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
        </div>

        <div className="max-w-2xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileQuestion className="h-10 w-10" strokeWidth={1.5} />
          </div>
          <h1 className="mt-8 text-8xl font-bold tracking-tight text-foreground">
            404
          </h1>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Page not found
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
            The page you’re looking for doesn’t exist or has been moved. Check
            the URL or explore the links below.
          </p>

          <div className="mt-10 flex flex-wrap  items-center justify-center gap-3">
            <Button size="lg" className="gap-2 rounded-xl shadow-sm">
              <Link href="/" className="flex items-center gap-2 flex-row">
                <Home className="h-4 w-4" />
                Go home
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 rounded-xl"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Go back
            </Button>
          </div>

          <div className="mt-12 rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm">
            <p className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
              <Search className="h-4 w-4" />
              Looking for something else?
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {[
                { to: "/", label: "Home" },
                { to: "/dashboard", label: "Dashboard" },
                { to: "/profile", label: "Settings" },
                { to: "/terms", label: "Terms" },
              ].map((item) => (
                <Link
                  key={item.to}
                  href={item.to}
                  className="rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      {/* <SiteFooter /> */}
    </div>
  );
};

export default NotFound;
