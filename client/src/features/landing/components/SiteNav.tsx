"use client";
import { useEffect, useState } from "react";

import { LayoutDashboardIcon, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggler from "@/components/ThemeToggle";
import useUserStore, {
  selectHydrated,
  selectIsLoggedIn,
} from "@/store/useUserStore";
import { useInitializeAuth } from "@/hooks/useInitializeAuth";
const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#demo", label: "Demo" },
  { href: "#security", label: "Security" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function SiteNav() {
  // Initialize Auth
  useInitializeAuth();
  const isUserLoggedIn = useUserStore(selectIsLoggedIn);
  const hydrated = useUserStore(selectHydrated);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center  justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex ">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground navLinks"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggler />

          {hydrated && !isUserLoggedIn ? (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm" className="text-sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="text-sm shadow-sm">
                  Get started free
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/dashboard">
              <Button className="px-6 rounded-md" variant="default">
                Dashboard
              </Button>
            </Link>
          )}
        </div>

        <div className="inline-flex items-center justify-center md:hidden gap-2">
          {hydrated && isUserLoggedIn && (
            <Link href="/dashboard">
              <Button
                className="rounded-md hidden xs:block"
                size="sm"
                variant="default"
              >
                <span className="">Dashboard</span>
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            onClick={() => setOpen((v) => !v)}
            className=" h-9 w-9  rounded-md text-foreground "
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border/60 pt-3">
              <div className="flex justify-end"></div>
              {!hydrated && !isUserLoggedIn && (
                <>
                  <Button variant="ghost" size="sm">
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button size="sm">
                    <Link href="/register">Get started free</Link>
                  </Button>
                </>
              )}

              {hydrated && isUserLoggedIn && (
                <Button
                  className="rounded-md  xs:hidden"
                  size="sm"
                  variant="default"
                >
                  <span className="">Dashboard</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
