"use client";

import { useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";


// ─── Types ────────────────────────────────────────────────────────────────────

export type Theme = "light" | "dark";

export interface ThemeTogglerProps {
  direction?: "vertical" | "horizontal";
  duration?: number;
  defaultTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EASING = "cubic-bezier(0.76, 0, 0.24, 1)";

function peekNextThemeBg(): string {
  const html = document.documentElement;
  html.classList.toggle("dark");
  const bg = getComputedStyle(document.body).backgroundColor;
  html.classList.toggle("dark");
  return bg || getComputedStyle(document.body).color || "currentColor";
}

function subscribeTheme(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

export function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// Becomes `true` only after hydration, so client-only parts (the curtain portal)
// mount after the server-rendered button. Uses useSyncExternalStore to avoid
// setState-in-effect and to keep SSR/hydration output identical.
function subscribeMounted(callback: () => void) {
  const id = requestAnimationFrame(callback);
  return () => cancelAnimationFrame(id);
}
const getMounted = () => true;
const getServerMounted = () => false;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ThemeToggler({
  direction = "vertical",
  duration = 550,
  defaultTheme = "light",
  onThemeChange,
  className,
}: ThemeTogglerProps) {
  const mounted = useSyncExternalStore(
    subscribeMounted,
    getMounted,
    getServerMounted,
  );
  const theme = useSyncExternalStore(
    subscribeTheme,
    getTheme,
    () => defaultTheme,
  );
  const animatingRef = useRef(false);
  const curtainRef = useRef<HTMLDivElement>(null);

  const isV = direction === "vertical";
  const scale0 = isV ? "scaleY(0)" : "scaleX(0)";
  const scale1 = isV ? "scaleY(1)" : "scaleX(1)";
  const originIn = isV ? "top center" : "left center";
  const originOut = isV ? "bottom center" : "right center";

  const toggle = () => {
    if (animatingRef.current) return;
    const curtain = curtainRef.current;
    if (!curtain) return;
    animatingRef.current = true;

    const next: Theme = theme === "dark" ? "light" : "dark";
    curtain.style.background = peekNextThemeBg();

    curtain.style.transition = "none";
    curtain.style.transformOrigin = originIn;
    curtain.style.transform = scale0;

    curtain.getBoundingClientRect();
    curtain.style.transition = `transform ${duration}ms ${EASING}`;
    curtain.style.transform = scale1;

    setTimeout(() => {
      document.documentElement.classList.toggle("dark", next === "dark");
      onThemeChange?.(next);

      curtain.style.transformOrigin = originOut;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          curtain.style.transform = scale0;
        });
      });
    }, duration);

    setTimeout(
      () => {
        curtain.style.transition = "none";
        curtain.style.transform = scale0;
        curtain.style.transformOrigin = originIn;
        animatingRef.current = false;
      },
      duration * 2 + 100,
    );
  };

  const isDark = theme === "dark";

  return (
    <>
      {mounted &&
        createPortal(
          <div
            ref={curtainRef}
            aria-hidden="true"
            className="fixed inset-0 pointer-events-none"
            style={{
              transform: scale0,
              transformOrigin: originIn,
              zIndex: 99999,
            }}
          />,
          document.body,
        )}

      <button
        type="button"
        onClick={toggle}
        className={cn(
          "bg-transparent  w-9 h-9  text-muted-foreground border border-border flex items-center justify-center rounded-full cursor-pointer outline-none hover:bg-muted/50 transition-colors",
          className,
        )}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </>
  );
}
