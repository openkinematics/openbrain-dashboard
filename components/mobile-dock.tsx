"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Home, Layers, Network, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoModeFromUrl, withDemoHref } from "@/lib/demo-routing";

/** Primary destinations for thumb reach on phones (see README mobile section). */
const DOCK = [
  { href: "/", label: "Home", icon: Home },
  { href: "/cockpit", label: "Drive", icon: Gamepad2 },
  { href: "/maps", label: "Maps", icon: Layers },
  { href: "/fleet", label: "Fleet", icon: Network },
  { href: "/settings", label: "Setup", icon: Settings },
] as const;

export function MobileDock() {
  const pathname = usePathname();
  const demoMode = useDemoModeFromUrl();

  return (
    <nav
      aria-label="Primary"
      className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-50 border-t pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto flex max-w-screen-2xl items-stretch justify-around gap-0.5 px-1 pt-1">
        {DOCK.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={withDemoHref(item.href, demoMode)}
                className={cn(
                  "flex min-h-12 min-w-[44px] touch-manipulation flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-[10px] leading-tight font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground active:bg-secondary/80",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
