"use client";

import { useMemo } from "react";
import { AppHeader } from "@/components/app-header";
import { PageEnter } from "@/components/page-enter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useBoxStore } from "@/lib/client-store";
import { roomMeta } from "@/lib/rooms";

export default function PrintPage() {
  const { boxes } = useBoxStore();
  const sorted = useMemo(
    () => boxes.slice().sort((a, b) => a.code.localeCompare(b.code)),
    [boxes],
  );

  return (
    <PageEnter>
      <div className="no-print">
        <AppHeader title="Backup sheet" backHref="/" />
        <p className="text-lg font-semibold leading-snug">
          Sharpie is enough. Print only if you want.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          One page of every code, in case a phone is dead. You do not need 4–5
          labels on each box.
        </p>
        <div className="mt-7 grid gap-3">
          <Button className="h-14 min-h-14 text-base" onClick={() => window.print()}>
            Print this page
          </Button>
        </div>
      </div>

      <h2 className="mt-8 text-2xl font-semibold tracking-tight">Chopra Boxes</h2>
      <Separator className="mt-3" />
      <table className="mt-4 w-full border-collapse text-left">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Code</th>
            <th className="py-2 pr-3 font-medium">Room</th>
            <th className="py-2 font-medium">Inside</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((box) => (
            <tr key={box.code} className="align-top">
              <td className="py-2.5 pr-3 font-mono text-base font-semibold">
                {box.code}
              </td>
              <td className="py-2.5 pr-3 text-sm">{roomMeta(box.room).name}</td>
              <td className="py-2.5 text-sm">
                {box.items.map((i) => i.label).join(", ") || "—"}
                {box.fragile ? " · Fragile" : ""}
                {box.openFirst ? " · Open first" : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </PageEnter>
  );
}
