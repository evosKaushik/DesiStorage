"use client";

import { useTheme } from "next-themes";
import { toast, ToastContainer } from "react-toastify";

/**
 * Thin client wrapper that adapts react-toastify to the current next-themes
 * theme. This is the ONLY component that needs "use client" for theme
 * detection — the root layout stays a Server Component.
 */
export default function ToastProvider() {
  const { resolvedTheme } = useTheme();

  return (
    <ToastContainer
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      closeOnClick
      pauseOnHover
      draggable
    />
  );
}

