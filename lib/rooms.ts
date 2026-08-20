import type { RoomId } from "@/lib/types";

export type RoomMeta = {
  id: string;
  name: string;
};

export const ROOMS: RoomMeta[] = [
  { id: "KIT", name: "Kitchen" },
  { id: "BED", name: "Bedroom" },
  { id: "KID", name: "Kids" },
  { id: "LIV", name: "Living" },
  { id: "DIN", name: "Dining" },
  { id: "BTH", name: "Bathroom" },
  { id: "GAR", name: "Garage" },
  { id: "OFF", name: "Office" },
  { id: "OTH", name: "Other" },
];

const BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r])) as Record<
  RoomId,
  RoomMeta
>;

export function roomMeta(id: string): RoomMeta {
  const key = id.trim().toUpperCase();
  if (isRoomId(key)) return BY_ID[key];
  return { id: key, name: key };
}

export function isRoomId(value: string): value is RoomId {
  return value in BY_ID;
}
