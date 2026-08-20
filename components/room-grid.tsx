"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizePrefix } from "@/lib/codes";
import { ROOMS, roomMeta, type RoomMeta } from "@/lib/rooms";

export function RoomGrid({
  onPick,
}: {
  onPick: (room: RoomMeta) => void;
}) {
  const [custom, setCustom] = useState(false);
  const [letters, setLetters] = useState("");

  const prefix = normalizePrefix(letters);

  if (custom) {
    return (
      <div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setCustom(false);
            setLetters("");
          }}
          className="mb-6 h-14 px-0 text-sm"
        >
          Back to rooms
        </Button>
        <p className="mb-4 text-base text-muted-foreground">
          Type a short code, like SE or GN. Two or three letters.
        </p>
        <Input
          value={letters}
          onChange={(e) => {
            const next = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
            setLetters(next);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && prefix) onPick(roomMeta(prefix));
          }}
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          maxLength={3}
          placeholder="SE"
          aria-label="Custom two or three letter code"
          className="h-20 min-h-20 text-center font-mono text-5xl font-bold tracking-[0.2em] uppercase"
        />
        <Button
          type="button"
          disabled={!prefix}
          onClick={() => {
            if (prefix) onPick(roomMeta(prefix));
          }}
          className="mt-4 h-14 min-h-14 w-full text-base"
        >
          {prefix ? `Use ${prefix}` : "Need 2 or 3 letters"}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {ROOMS.map((room) => (
          <Button
            key={room.id}
            type="button"
            variant="outline"
            onClick={() => onPick(room)}
            className="h-14 min-h-14 text-sm font-medium"
          >
            {room.name}
          </Button>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => setCustom(true)}
        className="mt-2 h-14 min-h-14 w-full text-sm font-medium"
      >
        Custom — like SE-357
      </Button>
    </div>
  );
}
