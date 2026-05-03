"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function readDemoFlag() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("demo") === "1";
}

export function useDemoModeFromUrl() {
  const pathname = usePathname();
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    setDemoMode(readDemoFlag());
  }, [pathname]);

  return demoMode;
}

export function withDemoHref(href: string, demoMode: boolean) {
  if (!demoMode) return href;
  const [pathname, rawQuery = ""] = href.split("?");
  const query = new URLSearchParams(rawQuery);
  query.set("demo", "1");
  return `${pathname}?${query.toString()}`;
}
