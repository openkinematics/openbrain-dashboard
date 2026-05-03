"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Gamepad2,
  Layout,
  Layers,
  Map,
  Network,
  Settings,
  User,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectionStatus } from "@/components/widgets/ConnectionStatus";
import { ThemeToggle } from "@/components/theme-toggle";
import { useDemoModeFromUrl, withDemoHref } from "@/lib/demo-routing";

const NAV = [
  { href: "/cockpit", label: "CockPit", icon: Gamepad2 },
  { href: "/maps", label: "Maps", icon: Layers },
  { href: "/missions", label: "Missions", icon: Map },
  { href: "/health", label: "Health", icon: Activity },
  { href: "/fleet", label: "Fleet", icon: Network },
  { href: "/my-ui", label: "My UI", icon: Layout },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/profile", label: "Profile", icon: User },
];

export function SiteNav() {
  const pathname = usePathname();
  const demoMode = useDemoModeFromUrl();
  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 border-b pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
      <div className="mx-auto flex min-h-14 w-full max-w-screen-2xl items-center gap-2 px-2 sm:gap-3 sm:px-3 md:px-6">
        <Link
          href={withDemoHref("/", demoMode)}
          className="flex min-h-11 min-w-[44px] shrink-0 touch-manipulation items-center gap-2 rounded-md px-1 py-1 sm:px-0"
        >
          <Wrench className="text-primary h-5 w-5" />
          <span className="font-display text-sm font-semibold tracking-tight sm:text-base">
            OpenBrain
          </span>
        </Link>

        <nav
          className="ml-1 flex flex-1 snap-x snap-mandatory items-center gap-0.5 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] md:ml-2 md:gap-1 [&::-webkit-scrollbar]:hidden"
          aria-label="All pages"
        >
          {NAV.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={withDemoHref(item.href, demoMode)}
                className={cn(
                  "inline-flex min-h-11 shrink-0 touch-manipulation snap-start items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors sm:px-3",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Suspense fallback={null}>
            <ConnectionStatus />
          </Suspense>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
