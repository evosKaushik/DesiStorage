"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

interface Link {
  label: string;
  href: string;
}

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;
  LINKS: Link[];
}

const HamburgerLinks = ({ LINKS, setOpen, open }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;

      if (!container) return;

      if (open) {
        // IN animation
        gsap.fromTo(
          container,
          {
            yPercent: -100,
            opacity: 0,
          },
          {
            yPercent: 0,
            duration: 0.7,
            opacity: 1,
            ease: "bounce.out",
          },
        );
      } else {
        // OUT animation
        gsap.to(container, {
          yPercent: -150,
          duration: 0.5,

          ease: "back.in(1.7)",
        });
      }
    },
    {
      dependencies: [open],
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
  "
    >
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
      </div>
    </div>
  );
};

export default HamburgerLinks;
