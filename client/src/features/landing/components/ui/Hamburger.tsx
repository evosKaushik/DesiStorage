"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Props {
  open: boolean;
  onClick: () => void;
}

export default function Hamburger({ open, onClick }: Props) {
  const top = useRef<HTMLSpanElement>(null);
  const middle = useRef<HTMLSpanElement>(null);
  const bottom = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({
      defaults: {
        duration: 0.3,
        ease: "power2.inOut",
      },
    });

    if (open) {
      tl.to(
        middle.current,
        {
          opacity: 0,
          duration: 0.2,
        },
        0,
      )
        .to(
          top.current,
          {
            y: 9,
            rotate: 45,
          },
          0,
        )
        .to(
          bottom.current,
          {
            y: -9,
            rotate: -45,
          },
          0,
        );
    } else {
      tl.to(
        middle.current,
        {
          opacity: 1,
          duration: 0.2,
        },
        0,
      )
        .to(
          top.current,
          {
            y: 0,
            rotate: 0,
          },
          0,
        )
        .to(
          bottom.current,
          {
            y: 0,
            rotate: 0,
          },
          0,
        );
    }

    return () => {
      tl.kill();
    };
  }, [open]);

  return (
    <button
      type="button"
      className="
      relative
      h-[30px] w-[30px]
      cursor-pointer
      border-none
      bg-transparent
      p-0

      md:h-[36px] md:w-[36px]

     md:hidden
    "
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
    >
      <span
        ref={top}
        className="
        absolute left-0 top-[4px]
        h-[3px] w-full
        rounded-[2px]
        bg-foreground

        md:top-[5px] md:h-[4px]
      "
      />

      <span
        ref={middle}
        className="
        absolute left-0 top-[13px]
        h-[3px] w-full
        rounded-[2px]
        bg-foreground

        md:top-[16px] md:h-[4px]
      "
      />

      <span
        ref={bottom}
        className="
        absolute left-0 top-[22px]
        h-[3px] w-full
        rounded-[2px]
        bg-foreground

        md:top-[27px] md:h-[4px]
      "
      />
    </button>
  );
}
