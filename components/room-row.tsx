"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizePrefix } from "@/lib/codes";
import { isRoomId, ROOMS, roomMeta } from "@/lib/rooms";

export function RoomRow({
  value,
  onChange,
  extras = [],
}: {
  value: string;
  onChange: (room: string) => void;
  extras?: string[];
}) {
  const [adding, setAdding] = useState(false);
  const [letters, setLetters] = useState("");
  const prefix = normalizePrefix(letters);

  const seen = new Set<string>();
  const chips = [...ROOMS];
  for (const extra of extras) {
    const id = extra.trim().toUpperCase();
    if (!id || isRoomId(id) || seen.has(id)) continue;
    seen.add(id);
    chips.push(roomMeta(id));
  }
  if (value && !isRoomId(value) && !seen.has(value) && !ROOMS.some((r) => r.id === value)) {
    chips.push(roomMeta(value));
  }

  function useCustom() {
    if (!prefix) return;
    onChange(prefix);
    setAdding(false);
    setLetters("");
  }

  return (
    <div>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {chips.map((room) => (
          <Badge
            key={room.id}
            variant={value === room.id && !adding ? "default" : "outline"}
            asChild
            className="h-11 shrink-0 cursor-pointer px-3 text-sm"
          >
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                onChange(room.id);
              }}
            >
              {room.name}
            </button>
          </Badge>
        ))}
        <Badge
          variant={adding ? "default" : "outline"}
          asChild
          className="h-11 shrink-0 cursor-pointer px-3 text-sm"
        >
          <button type="button" onClick={() => setAdding((open) => !open)}>
            Custom
          </button>
        </Badge>
      </div>
      {adding ? (
        <div className="mt-3 flex gap-2">
          <Input
            value={letters}
            onChange={(e) => {
              setLetters(
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z]/g, "")
                  .slice(0, 3),
              );
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                useCustom();
              }
            }}
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            maxLength={3}
            placeholder="SE"
            aria-label="Custom two or three letter code"
            className="h-14 min-h-14 font-mono text-2xl font-bold uppercase"
          />
          <Button
            type="button"
            disabled={!prefix}
            onClick={useCustom}
            className="h-14 min-h-14 px-5 text-base"
          >
            {prefix ? `Use ${prefix}` : "Use"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
