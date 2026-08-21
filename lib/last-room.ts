"use client";

import { useSyncExternalStore } from "react";
import { isPrefix, normalizePrefix } from "@/lib/codes";

const KEY = "chopra-boxes-last-room";
const EVENT = "chopra-boxes-last-room";
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
    if (!prefix) return;
    window.localStorage.setItem(KEY, prefix);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // ignore quota / private mode
  }
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(EVENT, onStoreChange);
  };
}

export function useLastRoom(preset: string | null): [string, (room: string) => void] {
  const stored = useSyncExternalStore(subscribe, readLastRoom, () => DEFAULT_ROOM);
  return [preset ?? stored, writeLastRoom];
}
