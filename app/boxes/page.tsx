"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { BoxListCard } from "@/components/box-list-card";
import { EmptyState } from "@/components/empty-state";
import { PageEnter } from "@/components/page-enter";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useBoxStore } from "@/lib/client-store";
import { isRoomId, ROOMS, roomMeta } from "@/lib/rooms";

export default function AllBoxesPage() {
  const { boxes } = useBoxStore();
  const [query, setQuery] = useState("");
  const [room, setRoom] = useState<string>("ALL");

  const chips = useMemo(() => {
    const extras = new Set<string>();
    for (const box of boxes) {
      const prefix = box.room.toUpperCase();
      if (!isRoomId(prefix)) extras.add(prefix);
    }
    return [
      ...ROOMS,
      ...Array.from(extras)
        .sort()
        .map((id) => roomMeta(id)),
    ];
  }, [boxes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return boxes
      .filter((b) => (room === "ALL" ? true : b.room.toUpperCase() === room))
      .filter((b) => {
        if (!q) return true;
        const hay = [b.code, b.notes, ...b.items.map((i) => i.label)]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .slice()
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [boxes, query, room]);

  return (
    <PageEnter>
      <AppHeader title="All boxes" backHref="/" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search plates, sheets, KIT-12, SE-357…"
        autoComplete="off"
        className="h-14 min-h-14 text-base"
      />
      <div className="no-scrollbar -mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1">
        <Badge
          variant={room === "ALL" ? "default" : "outline"}
          asChild
          className="h-10 shrink-0 cursor-pointer px-3 text-sm"
        >
          <button type="button" onClick={() => setRoom("ALL")}>
            All
          </button>
        </Badge>
        {chips.map((r) => (
          <Badge
            key={r.id}
            variant={room === r.id ? "default" : "outline"}
            asChild
            className="h-10 shrink-0 cursor-pointer px-3 text-sm"
          >
            <button type="button" onClick={() => setRoom(r.id)}>
              {r.name}
            </button>
          </Badge>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            title="No boxes match that."
            hint="Try another room, or add a new box from the home screen."
          />
        ) : (
          filtered.map((box) => <BoxListCard key={box.code} box={box} />)
        )}
      </div>
    </PageEnter>
  );
}
