"use client";

import Link from "next/link";
import { List, Plus, Search } from "lucide-react";
import { PageEnter } from "@/components/page-enter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBoxStore } from "@/lib/client-store";
import { TARGET_BOX_COUNT } from "@/lib/types";

export default function HomePage() {
  const { boxes, offline } = useBoxStore();
  const realCount = boxes.filter((b) => !b.example).length;
  const shown = boxes.length;

  return (
    <PageEnter className="flex min-h-[calc(100dvh-2.4rem)] flex-col justify-between">
      <div className="pt-6">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Family move
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Chopra Boxes
        </h1>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
          Write the code on every side. Look it up when you need what’s inside.
        </p>
        <p className="mt-8 text-4xl font-semibold tracking-tight">
          {shown}
          <span className="ml-1 text-xl font-normal text-muted-foreground">
            of ~{TARGET_BOX_COUNT}
          </span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {realCount === 0
            ? "Three examples are ready. Delete them when you start packing."
            : `${realCount} real ${realCount === 1 ? "box" : "boxes"} packed.`}
          {offline ? " Offline — using this phone’s copy." : ""}
        </p>
      </div>

      <nav className="mt-10 grid gap-3">
        <Card className="bg-primary text-primary-foreground ring-0">
          <Link href="/find" className="block tap">
            <CardHeader className="flex flex-row items-center gap-4">
              <Search className="size-6 shrink-0" />
              <div>
                <CardTitle className="text-lg text-primary-foreground">
                  Find a box
                </CardTitle>
                <CardDescription className="text-primary-foreground/70">
                  Room, then the number
                </CardDescription>
              </div>
            </CardHeader>
          </Link>
        </Card>
        <Card>
          <Link href="/new" className="block tap">
            <CardHeader className="flex flex-row items-center gap-4">
              <Plus className="size-6 shrink-0" />
              <div>
                <CardTitle className="text-lg">New box</CardTitle>
                <CardDescription>Get a code and Sharpie it</CardDescription>
              </div>
            </CardHeader>
          </Link>
        </Card>
        <Card>
          <Link href="/boxes" className="block tap">
            <CardHeader className="flex flex-row items-center gap-4">
              <List className="size-6 shrink-0" />
              <div>
                <CardTitle className="text-lg">All boxes</CardTitle>
                <CardDescription>Browse, search, unpack</CardDescription>
              </div>
            </CardHeader>
          </Link>
        </Card>
      </nav>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Sharpie is enough.
        <Button asChild variant="link" className="h-auto px-1 text-sm">
          <Link href="/print">Optional backup sheet</Link>
        </Button>
      </p>
    </PageEnter>
  );
}
