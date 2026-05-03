import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50dvh] max-w-md flex-col items-center justify-center gap-4 px-4 py-8 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] text-center md:min-h-[60dvh] md:pb-8">
      <p className="font-display text-primary text-4xl font-semibold sm:text-5xl">404</p>
      <h1 className="text-lg font-medium text-balance">This page didn&apos;t connect.</h1>
      <p className="text-muted-foreground text-sm">
        The robot you were looking for might be in another network.
      </p>
      <Button className="min-h-11 w-full max-w-xs" asChild>
        <Link href="/">Back to robot selector</Link>
      </Button>
    </div>
  );
}
