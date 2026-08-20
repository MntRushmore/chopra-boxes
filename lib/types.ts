export const ROOM_IDS = [
  "KIT",
  "BED",
  "KID",
  "LIV",
  "DIN",
  "BTH",
  "GAR",
  "OFF",
  "OTH",
] as const;

export type RoomId = (typeof ROOM_IDS)[number];

/** 2–3 letter prefix: a built-in room or a custom code like SE / GN. */
export type RoomPrefix = string;

export type BoxItem = {
  id: string;
  label: string;
  unpacked: boolean;
};

export type Box = {
  code: string;
  room: RoomPrefix;
  items: BoxItem[];
  notes: string;
  fragile: boolean;
  openFirst: boolean;
  example?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Counters = Record<string, number>;

export type StoreSnapshot = {
  boxes: Box[];
  counters: Counters;
};

export type CreateBoxInput = {
  room: RoomPrefix;
  code?: string;
  items?: BoxItem[];
  notes?: string;
  fragile?: boolean;
  openFirst?: boolean;
  example?: boolean;
};

export type UpdateBoxInput = Partial<
  Pick<Box, "items" | "notes" | "fragile" | "openFirst" | "example">
>;

export const TARGET_BOX_COUNT = 60;

export function emptyCounters(): Counters {
  return {
    KIT: 0,
    BED: 0,
    KID: 0,
    LIV: 0,
    DIN: 0,
    BTH: 0,
    GAR: 0,
    OFF: 0,
    OTH: 0,
  };
}
