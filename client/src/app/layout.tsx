import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import RouteProgress from "@/components/RouteProgress";
import ToastProvider from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "DesiStorage",
  description:
    "Upload, organize, share and preview every file in one beautifully fast workspace. End-to-end encrypted. Priced in rupees. Built for teams that ship.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col ">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <RouteProgress />
          </Suspense>
          {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
