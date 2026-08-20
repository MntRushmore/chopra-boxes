"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppHeader({
  title,
  backHref,
  right,
}: {
  title: string;
  backHref?: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <header className="mb-8 flex items-center gap-1">
      {backHref ? (
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="tap -ml-2 size-14"
          aria-label="Back"
        >
          <Link href={backHref}>
            <ChevronLeft className="size-6" />
          </Link>
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="tap -ml-2 size-14"
          aria-label="Back"
          onClick={() => router.back()}
        >
          <ChevronLeft className="size-6" />
        </Button>
      )}
      <h1 className="flex-1 text-xl font-semibold tracking-tight">{title}</h1>
      {right}
    </header>
  );
}
