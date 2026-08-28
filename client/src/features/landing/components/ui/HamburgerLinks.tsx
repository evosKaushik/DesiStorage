
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
          }
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
    }
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
    </div>
  );
};

export default HamburgerLinks;

