import { isPrefix, normalizePrefix } from "@/lib/codes";

const KEY = "chopra-boxes-last-room";
const DEFAULT_ROOM = "OTH";

export function readLastRoom(): string {
  if (typeof window === "undefined") return DEFAULT_ROOM;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw || !isPrefix(raw)) return DEFAULT_ROOM;
    return normalizePrefix(raw) ?? DEFAULT_ROOM;
  } catch {
    return DEFAULT_ROOM;
  }
}

export function writeLastRoom(room: string) {
  if (typeof window === "undefined") return;
  try {
    const prefix = normalizePrefix(room);
    if (prefix) window.localStorage.setItem(KEY, prefix);
  } catch {
    // ignore quota / private mode
  }
}
