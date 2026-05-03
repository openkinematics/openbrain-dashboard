"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Suspense, type ReactNode } from "react";
import { DemoModeGuard } from "./demo-mode-guard";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {/* Guard reads the URL — wrap in Suspense so it doesn't break SSR. */}
      <Suspense fallback={null}>
        <DemoModeGuard />
      </Suspense>
      {children}
    </NextThemesProvider>
  );
}
