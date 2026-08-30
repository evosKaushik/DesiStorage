"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import ThemeToggler from "@/components/ThemeToggle";
import Hamburger from "./ui/Hamburger";
import HamburgerLinks from "./ui/HamburgerLinks";
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

        <div className="inline-flex justify-center items-center gap-4 xs:gap-8">
          <ThemeToggler />

          <Hamburger open={open} onClick={() => setOpen((v) => !v)} />
        </div>
      </div>

      <HamburgerLinks LINKS={LINKS} setOpen={setOpen} open={open} />
    </header>
  );
}
