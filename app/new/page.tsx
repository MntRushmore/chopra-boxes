"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { CodeMark } from "@/components/code-mark";
import { ItemComposer } from "@/components/item-composer";
import { PageEnter } from "@/components/page-enter";
import { RoomGrid } from "@/components/room-grid";
import { ToggleRow } from "@/components/toggle-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBoxStore } from "@/lib/client-store";
import { isPrefix, normalizePrefix } from "@/lib/codes";
import { roomMeta, type RoomMeta } from "@/lib/rooms";
import { newId } from "@/lib/utils";
import type { Box, BoxItem } from "@/lib/types";

function NewBoxFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetRaw = searchParams.get("room");
  const requestedCode = searchParams.get("code");
  const preset =
    presetRaw && isPrefix(presetRaw)
      ? roomMeta(normalizePrefix(presetRaw) ?? presetRaw)
      : null;
  const { createBox, updateBox, peekNextCode, suggestions } = useBoxStore();

  const [room, setRoom] = useState<RoomMeta | null>(preset);
  const [box, setBox] = useState<Box | null>(null);
  const [wrote, setWrote] = useState(false);
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!room || box || creating) return;
    setCreating(true);
    createBox({ room: room.id, code: requestedCode ?? undefined })
      .then((created) => {
        setBox(created);
        toast(`${created.code} is yours — write it on every side`);
      })
      .finally(() => setCreating(false));
  }, [box, createBox, creating, requestedCode, room]);

  async function addItem(label: string) {
    if (!box) return;
    const item: BoxItem = { id: newId(), label, unpacked: false };
    const next = { ...box, items: [...box.items, item] };
    setBox(next);
    await updateBox(box.code, { items: next.items });
  }

  async function saveAndOpen() {
    if (!box) return;
    await updateBox(box.code, {
      items: box.items,
      notes,
      fragile: box.fragile,
      openFirst: box.openFirst,
    });
    toast(`Saved ${box.code}`);
    router.replace(`/boxes/${box.code}`);
  }

  if (!room) {
    return (
      <PageEnter>
        <AppHeader title="New box" backHref="/" />
        <p className="mb-6 text-base text-muted-foreground">
          Which room is this box for?
        </p>
        <RoomGrid onPick={setRoom} />
      </PageEnter>
    );
  }

  if (!box) {
    return (
      <PageEnter>
        <AppHeader title="New box" backHref="/" />
        <p className="text-base text-muted-foreground">
          Getting the next {room.name} code…
        </p>
        <p className="mt-12 text-center font-mono text-6xl font-bold tracking-tight">
          {peekNextCode(room.id)}
        </p>
      </PageEnter>
    );
  }

  if (!wrote) {
    return (
      <PageEnter className="flex min-h-[calc(100dvh-2.4rem)] flex-col">
        <AppHeader title="Write this" backHref="/" />
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="max-w-xs text-base text-muted-foreground">
            Big Sharpie letters. Same code on every side.
          </p>
          <div className="my-12">
            <CodeMark code={box.code} room={box.room} size="hero" />
          </div>
          <p className="text-sm text-muted-foreground">
            Top, front, and both ends.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setWrote(true)}
          className="mt-6 h-14 min-h-14 w-full text-base"
        >
          I wrote {box.code} on every side
        </Button>
      </PageEnter>
    );
  }

  return (
    <PageEnter>
      <AppHeader title="What’s inside?" backHref="/" />
      <div className="mb-6">
        <CodeMark code={box.code} room={box.room} size="md" />
      </div>
      <ItemComposer suggestions={suggestions} onAdd={addItem} />
      {box.items.length > 0 ? (
        <ul className="mt-5 space-y-2">
          {box.items.map((item) => (
            <li key={item.id}>
              <Card>
                <CardContent className="py-3 text-base font-medium">
                  {item.label}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          Type an item and press Return. Five things takes about 20 seconds.
        </p>
      )}
      <div className="mt-7 space-y-3">
        <ToggleRow
          checked={box.fragile}
          onCheckedChange={async (fragile) => {
            setBox({ ...box, fragile });
            await updateBox(box.code, { fragile });
          }}
          title="Fragile"
          hint="Glass, dishes, or anything that breaks"
        />
        <ToggleRow
          checked={box.openFirst}
          onCheckedChange={async (openFirst) => {
            setBox({ ...box, openFirst });
            await updateBox(box.code, { openFirst });
          }}
          title="Open first"
          hint="Need this the first night"
        />
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional note"
          className="h-14 min-h-14 text-base"
        />
      </div>
      <Button className="mt-8 h-14 min-h-14 w-full text-base" onClick={saveAndOpen}>
        Done — {box.items.length}{" "}
        {box.items.length === 1 ? "item" : "items"}
      </Button>
    </PageEnter>
  );
}

export default function NewBoxPage() {
  return (
    <Suspense
      fallback={
        <main>
          <AppHeader title="New box" backHref="/" />
        </main>
      }
    >
      <NewBoxFlow />
    </Suspense>
  );
}
