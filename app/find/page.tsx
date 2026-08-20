"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { NumberPad } from "@/components/number-pad";
import { PageEnter } from "@/components/page-enter";
import { RoomGrid } from "@/components/room-grid";
import { Scanner } from "@/components/scanner";
import { Sheet } from "@/components/sheet";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBoxStore } from "@/lib/client-store";
import { formatCode, parseCode } from "@/lib/codes";
import { roomMeta, type RoomMeta } from "@/lib/rooms";

export default function FindPage() {
  const router = useRouter();
  const { getBox } = useBoxStore();
  const [room, setRoom] = useState<RoomMeta | null>(null);
  const [digits, setDigits] = useState("");
  const [scan, setScan] = useState(false);
  const [missing, setMissing] = useState<string | null>(null);

  function go(code: string) {
    const box = getBox(code);
    if (box) {
      router.push(`/boxes/${box.code}`);
      return;
    }
    const parsed = parseCode(code);
    if (parsed) {
      setRoom(roomMeta(parsed.room));
      setDigits(String(parsed.n));
    }
    setMissing(code);
  }

  function addDigit(d: string) {
    const next = (digits + d).slice(0, 3);
    setDigits(next);
    setMissing(null);
    if (room && next.length === 3) {
      go(formatCode(room.id, Number.parseInt(next, 10)));
    }
  }

  function submit() {
    if (!room || !digits) return;
    go(formatCode(room.id, Number.parseInt(digits, 10)));
  }

  return (
    <PageEnter>
      <AppHeader title="Find a box" backHref="/" />
      {!room ? (
        <div>
          <p className="mb-6 text-base text-muted-foreground">
            First tap the room written on the box.
          </p>
          <RoomGrid
            onPick={(picked) => {
              setRoom(picked);
              setDigits("");
              setMissing(null);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => setScan(true)}
            className="mt-8 h-14 min-h-14 w-full text-muted-foreground"
          >
            <Camera className="size-4" />
            Read the Sharpie
          </Button>
        </div>
      ) : (
        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setRoom(null);
              setDigits("");
              setMissing(null);
            }}
            className="mb-6 h-14 px-0 text-sm"
          >
            {room.name} · change room
          </Button>
          <p className="mb-8 text-center font-mono text-6xl font-bold tracking-tight">
            {room.id}-{digits || "···"}
          </p>
          <NumberPad
            onDigit={addDigit}
            onBack={() => {
              setDigits((d) => d.slice(0, -1));
              setMissing(null);
            }}
            onGo={submit}
          />
          {missing ? (
            <Card className="mt-8 text-center">
              <CardHeader>
                <CardTitle>No box {missing} yet.</CardTitle>
                <CardDescription>
                  Maybe the Sharpie number is different — or it was never added.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="h-14 min-h-14 w-full text-base"
                  onClick={() =>
                    router.push(`/new?room=${room.id}&code=${missing}`)
                  }
                >
                  Create {missing}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setScan(true)}
              className="mt-8 h-14 min-h-14 w-full text-muted-foreground"
            >
              <Camera className="size-4" />
              Read the writing
            </Button>
          )}
        </div>
      )}
      <Sheet open={scan} onOpenChange={setScan} title="Read the Sharpie">
        <p className="mb-3 text-sm text-muted-foreground">
          Point at the letters on the box, then tap Read this.
        </p>
        <Scanner
          onFound={(code) => {
            setScan(false);
            go(code);
          }}
        />
      </Sheet>
    </PageEnter>
  );
}
