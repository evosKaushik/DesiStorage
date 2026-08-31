"use client";

import { Button } from "@/components/ui/button";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { useRef } from "react";

interface Link {
  label: string;
  href: string;
}

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;
  LINKS: Link[];
  hydrated: boolean;
  isUserLoggedIn: boolean;
}

const HamburgerLinks = ({
  LINKS,
  setOpen,
  open,
  hydrated,
  isUserLoggedIn,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;

      if (!container) return;

      gsap.killTweensOf(container);

      if (open) {
        // Menu opening
        gsap.fromTo(
          container,
          {
            yPercent: -100,
            opacity: 0,
          },
          {
            yPercent: 0,
            opacity: 1,
            pointerEvents: "auto",
            duration: 0.5,
            ease: "power3.out",
          },
        );
      } else {
        // Menu closing
        gsap.to(container, {
          yPercent: -100,
          opacity: 0,
          pointerEvents: "none",
          duration: 0.35,
          ease: "power2.in",
        });
      }
    },
    {
      dependencies: [open],
      scope: containerRef,
    },
  );


  return (
    <div
      ref={containerRef}
      className="
        absolute
        left-0
        top-full
        w-full
        border-t
        border-border/60
        bg-background
        md:hidden

        opacity-0
        pointer-events-none
      "
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className="
              rounded-md
              px-3
              py-2
              text-sm
              font-medium
              text-muted-foreground
              transition-colors
              hover:bg-accent
              hover:text-foreground
            "
          >
            {link.label}
          </a>
        ))}
      </div>
      <div className="mt-2 w-[90%] mx-auto flex max-xs:flex-col gap-2 border-t border-border pt-3 ">
        {hydrated && !isUserLoggedIn && (
          <>
            <Button variant="outline" size="sm" className="grow">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="grow">
              <Link href="/register">Get started free</Link>
            </Button>
          </>
        )}

        {hydrated && isUserLoggedIn && (
          <Link href="/dashboard" className="grow">
            <Button className="rounded-md w-full" size="sm" variant="default">
              Dashboard
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default HamburgerLinks;
