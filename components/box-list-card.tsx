"use client";

import Link from "next/link";
import { AlertTriangle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Box } from "@/lib/types";
import { roomMeta } from "@/lib/rooms";

export function BoxListCard({ box }: { box: Box }) {
  const meta = roomMeta(box.room);
  const preview = box.items
    .slice(0, 3)
    .map((i) => i.label)
    .join(" · ");

  return (
    <Link href={`/boxes/${box.code}`} className="block">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="font-mono text-lg">{box.code}</CardTitle>
            <CardDescription className="mt-1 truncate">
              {preview || "Empty — add what’s inside"}
            </CardDescription>
          </div>
          <Badge variant="outline">{meta.name}</Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 pb-1 text-xs text-muted-foreground">
          {box.example ? <Badge variant="secondary">Example</Badge> : null}
          {box.fragile ? (
            <span className="inline-flex items-center gap-1">
              <AlertTriangle className="size-3.5" /> Fragile
            </span>
          ) : null}
          {box.openFirst ? (
            <span className="inline-flex items-center gap-1">
              <Sparkles className="size-3.5" /> Open first
            </span>
          ) : null}
          <span>
            {box.items.length} {box.items.length === 1 ? "item" : "items"}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
