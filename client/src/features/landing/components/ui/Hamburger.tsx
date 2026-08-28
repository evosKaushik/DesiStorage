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
    const bars = [top.current, middle.current, bottom.current];

    if (!open) {
      gsap.to(bars, {
        y: 0,
        rotate: 0,
        opacity: 1,
        duration: 0.3,
        ease: "power2.inOut",
        overwrite: true,
      });
      return;
    }

    gsap.set(bars, { clearProps: "transform,opacity", overwrite: true });

    const centerOf = (el: HTMLElement) =>
      el.getBoundingClientRect().top + el.offsetHeight / 2;

    const midCenter = centerOf(middle.current!);
    const topCenter = centerOf(top.current!);
    const bottomCenter = centerOf(bottom.current!);

    const tl = gsap.timeline({
      defaults: { duration: 0.3, ease: "power2.inOut", overwrite: true },
    });

    tl.to(middle.current, { opacity: 0, duration: 0.17 }, 0)
      .to(top.current, { y: midCenter - topCenter, rotate: 45 }, 0)
      .to(bottom.current, { y: midCenter - bottomCenter, rotate: -45 }, 0);

    return () => {
      tl.kill();
    };
  }, [open]);

  return (
    <button
      type="button"
      className="
      relative
      h-[24px] w-[24px]
      shrink-0
      cursor-pointer
      border-none
      bg-transparent
      p-0

      min-[376px]:h-[30px] min-[376px]:w-[30px]

      md:hidden
    "
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
    >
      <span
        ref={top}
        className="
        absolute left-0 top-[3px]
        h-[2px] min-[376px]:h-[3px] w-full
        rounded-[2px]
        bg-foreground
      "
      />

      <span
        ref={middle}
        className="
        absolute left-0 top-[10px] min-[376px]:top-[13px]
        h-[2px] min-[376px]:h-[3px] w-full
        rounded-[2px]
        bg-foreground
      "
      />

      <span
        ref={bottom}
        className="
        absolute left-0 top-[17px] min-[376px]:top-[23px]
        h-[2px] min-[376px]:h-[3px] w-full
        rounded-[2px]
        bg-foreground
      "
      />
    </button>
  );
}