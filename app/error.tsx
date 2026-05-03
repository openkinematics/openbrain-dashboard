"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[openbrain-dashboard]", error);
  }, [error]);
  return (
    <div className="mx-auto flex min-h-[50dvh] max-w-md flex-col items-center justify-center gap-4 px-4 py-8 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] text-center md:min-h-[60dvh] md:pb-8">
      <p className="font-display text-destructive text-2xl font-semibold sm:text-3xl">
        Something broke.
      </p>
      <p className="text-muted-foreground text-sm break-words">
        {error.message || "Unknown error rendering this page."}
      </p>
      <Button className="min-h-11 w-full max-w-xs" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
