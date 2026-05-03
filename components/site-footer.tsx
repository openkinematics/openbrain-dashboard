import { ExternalLink } from "lucide-react";
import { DASHBOARD_REPO_URL, MARKETING_URL } from "@/lib/env";
import { cn } from "@/lib/utils";

const marketingSiteHref = `${MARKETING_URL.replace(/\/+$/, "")}/`;

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "border-border bg-background/90 fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] z-30 h-16 border-t px-3 backdrop-blur-md md:bottom-0 md:h-14 md:px-6",
        className,
      )}
    >
      <div className="text-muted-foreground mx-auto flex h-full max-w-screen-2xl items-center justify-between gap-3 text-xs">
        <p className="min-w-0 truncate">OpenBrain Dashboard · OpenKinematics</p>
        <nav
          aria-label="External links"
          className="flex shrink-0 items-center justify-center gap-3 sm:gap-4"
        >
          <a
            className="hover:text-primary inline-flex min-h-11 items-center gap-1.5 underline-offset-4 hover:underline"
            href={marketingSiteHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            Website
          </a>
          <a
            className="hover:text-primary inline-flex min-h-11 items-center gap-1.5 underline-offset-4 hover:underline"
            href={DASHBOARD_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
