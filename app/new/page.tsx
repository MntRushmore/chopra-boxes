"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { CodeMark } from "@/components/code-mark";
import { PageEnter } from "@/components/page-enter";
import { RoomRow } from "@/components/room-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { announceCode, speakCode } from "@/lib/announce";
import { useBoxStore } from "@/lib/client-store";
import { isPrefix, normalizeCode, normalizePrefix } from "@/lib/codes";
import { readLastRoom, writeLastRoom } from "@/lib/last-room";
import { roomMeta } from "@/lib/rooms";
import { newId } from "@/lib/utils";
import type { Box } from "@/lib/types";

function NewBoxFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetRaw = searchParams.get("room");
  const requestedCode = searchParams.get("code");
  const preset =
    presetRaw && isPrefix(presetRaw)
      ? normalizePrefix(presetRaw) ?? presetRaw.toUpperCase()
      : null;
  const requested = requestedCode ? normalizeCode(requestedCode) : null;

  const { createBox, updateBox, peekNextCode, ready, boxes } = useBoxStore();
  const [roomId, setRoomId] = useState(preset ?? "OTH");
  const [box, setBox] = useState<Box | null>(null);
  const [contents, setContents] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const contentsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (preset) {
      setRoomId(preset);
      writeLastRoom(preset);
      return;
    }
    setRoomId(readLastRoom());
  }, [preset]);

  const extras = useMemo(() => {
    const seen = new Set<string>();
    for (const item of boxes) {
      seen.add(item.room.toUpperCase());
    }
    return Array.from(seen);
  }, [boxes]);

  const preview = requested ?? peekNextCode(roomId);
  const room = roomMeta(roomId);

  function pickRoom(next: string) {
    setRoomId(next);
    writeLastRoom(next);
  }

  async function generate() {
    if (creating || !ready) return;
    const codeToSpeak = requested ?? peekNextCode(roomId);
    announceCode(codeToSpeak);
    writeLastRoom(roomId);
    setCreating(true);
    try {
      const created = await createBox({
        room: roomId,
        code: requested ?? undefined,
      });
      setBox(created);
      setContents("");
      setLastSaved(null);
      if (created.code !== codeToSpeak) {
        speakCode(created.code);
      }
      if (requested || preset) {
        router.replace("/new");
      }
      requestAnimationFrame(() => contentsRef.current?.focus());
    } catch {
      toast("Could not create that box. Try Generate again.");
    } finally {
      setCreating(false);
    }
  }

  async function save() {
    if (!box || saving) return;
    setSaving(true);
    const text = contents.trim();
    try {
      await updateBox(box.code, {
        items: text
          ? [{ id: newId(), label: text, unpacked: false }]
          : box.items,
      });
      toast(`Saved ${box.code}`);
      setLastSaved(box.code);
      setBox(null);
      setContents("");
    } catch {
      toast("Saved on this phone. You can keep packing.");
      setLastSaved(box.code);
      setBox(null);
      setContents("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageEnter className="flex min-h-[calc(100dvh-2.4rem)] flex-col">
      <AppHeader title="New box" backHref="/" />

      {!box ? (
        <div className="flex flex-1 flex-col">
          <p className="mb-3 text-sm text-muted-foreground">
            Same room as last time, unless you change it.
          </p>
          <RoomRow value={roomId} onChange={pickRoom} extras={extras} />

          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="max-w-sm text-lg leading-relaxed text-muted-foreground">
              {lastSaved
                ? `Saved ${lastSaved}. Tap Generate for the next one.`
                : "Tap Generate. You’ll hear the code — write it with a Sharpie."}
            </p>
            {ready ? (
              <p className="mt-4 font-mono text-sm text-muted-foreground">
                Next {room.name}: {preview}
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            disabled={!ready || creating}
            onClick={() => void generate()}
            className="mt-6 h-24 min-h-24 w-full text-2xl font-semibold"
          >
            {!ready ? "Getting ready…" : lastSaved ? "Generate next" : "Generate code"}
          </Button>
        </div>
      ) : (
        <form
          className="flex flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              {roomMeta(box.room).name} · tap the code to hear it again
            </p>
            <button
              type="button"
              onClick={() => announceCode(box.code)}
              className="my-8 tap"
              aria-label={`Hear ${box.code} again`}
            >
              <CodeMark code={box.code} room={box.room} size="hero" />
            </button>
            <p className="sr-only" aria-live="assertive">
              {box.code}
            </p>
          </div>

          <label className="mb-2 text-sm text-muted-foreground" htmlFor="contents">
            What’s inside?
          </label>
          <Input
            ref={contentsRef}
            id="contents"
            value={contents}
            onChange={(e) => setContents(e.target.value)}
            placeholder="Plates, mixer, pantry stuff"
            autoComplete="off"
            enterKeyHint="done"
            className="h-20 min-h-20 text-xl"
          />
          <Button
            type="submit"
            disabled={saving}
            className="mt-5 h-20 min-h-20 w-full text-2xl font-semibold"
          >
            {saving ? "Saving…" : "Done"}
          </Button>
        </form>
      )}
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
