import { newId } from "@/lib/utils";
import type { Box, StoreSnapshot } from "@/lib/types";
import { emptyCounters } from "@/lib/types";

function item(label: string) {
  return { id: newId(), label, unpacked: false };
}

function stamp(code: string, room: Box["room"], extra: Partial<Box>): Box {
  const now = "2026-08-01T12:00:00.000Z";
  return {
    code,
    room,
    items: [],
    notes: "Example box — tap Delete when you are ready to use this app for real.",
    fragile: false,
    openFirst: false,
    example: true,
    createdAt: now,
    updatedAt: now,
    ...extra,
  };
}

export function seedSnapshot(): StoreSnapshot {
  const boxes: Box[] = [
    stamp("KIT-01", "KIT", {
      items: [
        item("Pots and pans"),
        item("Mixing bowls"),
        item("Everyday spices"),
      ],
      fragile: true,
      openFirst: true,
    }),
    stamp("BED-01", "BED", {
      items: [item("Sheets"), item("Pillowcases"), item("Alarm clock")],
      openFirst: true,
    }),
    stamp("KID-01", "KID", {
      items: [
        item("Stuffed animals"),
        item("Board games"),
        item("Art supplies"),
      ],
    }),
  ];

  const counters = emptyCounters();
  counters.KIT = 1;
  counters.BED = 1;
  counters.KID = 1;

  return { boxes, counters };
}
