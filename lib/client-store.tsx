"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { codesMatch, nextCode as peekNext, normalizeCode, numberFromCode } from "@/lib/codes";
import {
  emptyCounters,
  type Box,
  type CreateBoxInput,
  type StoreSnapshot,
  type UpdateBoxInput,
} from "@/lib/types";

const CACHE_KEY = "chopra-boxes-cache-v1";

type BoxStoreValue = {
  boxes: Box[];
  counters: StoreSnapshot["counters"];
  ready: boolean;
  offline: boolean;
  getBox: (code: string) => Box | undefined;
  peekNextCode: (room: CreateBoxInput["room"]) => string;
  createBox: (input: CreateBoxInput) => Promise<Box>;
  updateBox: (code: string, patch: UpdateBoxInput) => Promise<Box>;
  deleteBox: (code: string) => Promise<void>;
  suggestions: string[];
};

const BoxStoreContext = createContext<BoxStoreValue | null>(null);

function codeKey(code: string) {
  return normalizeCode(code) ?? code.trim().toUpperCase();
}

function isExample(box: Box) {
  return Boolean(box.example);
}

function hasRealBoxes(boxes: Box[]) {
  return boxes.some((box) => !isExample(box));
}

function isSeedOrEmpty(boxes: Box[]) {
  return boxes.length === 0 || boxes.every(isExample);
}

function newerBox(a: Box, b: Box) {
  const aTime = Date.parse(a.updatedAt) || 0;
  const bTime = Date.parse(b.updatedAt) || 0;
  if (bTime !== aTime) return bTime > aTime ? b : a;
  return a;
}

/** Prefer non-example over example; otherwise the newer updatedAt (local on tie). */
function pickBox(local: Box, remote: Box) {
  const localEx = isExample(local);
  const remoteEx = isExample(remote);
  if (localEx !== remoteEx) return localEx ? remote : local;
  return newerBox(local, remote);
}

function bumpFromBoxes(counters: StoreSnapshot["counters"], boxes: Box[]) {
  const next = { ...counters };
  for (const box of boxes) {
    const n = numberFromCode(box.code);
    const room = box.room.toUpperCase();
    next[room] = Math.max(next[room] ?? 0, n);
  }
  return next;
}

export function mergeSnapshots(local: StoreSnapshot | null, remote: StoreSnapshot): StoreSnapshot {
  const remoteNorm: StoreSnapshot = {
    boxes: Array.isArray(remote.boxes) ? remote.boxes : [],
    counters: { ...emptyCounters(), ...remote.counters },
  };
  if (!local) return remoteNorm;

  const localHasReal = hasRealBoxes(local.boxes);
  const remoteSeedOnly = isSeedOrEmpty(remoteNorm.boxes);
  const byCode = new Map<string, Box>();

  for (const box of local.boxes) {
    byCode.set(codeKey(box.code), box);
  }

  for (const box of remoteNorm.boxes) {
    const key = codeKey(box.code);
    const existing = byCode.get(key);
    if (!existing) {
      // Never re-seed examples over a real local list (or fill an empty remote over reals).
      if (localHasReal && remoteSeedOnly && isExample(box)) continue;
      byCode.set(key, box);
      continue;
    }
    byCode.set(key, pickBox(existing, box));
  }

  const boxes = Array.from(byCode.values());
  const counters = { ...emptyCounters(), ...local.counters };
  for (const [room, n] of Object.entries(remoteNorm.counters)) {
    counters[room] = Math.max(counters[room] ?? 0, n ?? 0);
  }

  return {
    boxes,
    counters: bumpFromBoxes(counters, boxes),
  };
}

function localHasRealRemoteLacks(local: StoreSnapshot, remote: StoreSnapshot) {
  const remoteKeys = new Set((remote.boxes ?? []).map((box) => codeKey(box.code)));
  return local.boxes.some((box) => !isExample(box) && !remoteKeys.has(codeKey(box.code)));
}

function readCache(): StoreSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoreSnapshot;
    if (!Array.isArray(parsed.boxes)) return null;
    return {
      boxes: parsed.boxes,
      counters: { ...emptyCounters(), ...parsed.counters },
    };
  } catch {
    return null;
  }
}

function writeCache(data: StoreSnapshot) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota
  }
}

export function BoxStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoreSnapshot>({
    boxes: [],
    counters: emptyCounters(),
  });
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(false);

  const apply = useCallback((next: StoreSnapshot) => {
    setData(next);
    writeCache(next);
  }, []);

  useEffect(() => {
    void navigator.storage?.persist?.();

    const cached = readCache();
    if (cached) {
      setData(cached);
      setReady(true);
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/boxes", { cache: "no-store" });
        if (!res.ok) throw new Error("bad response");
        const remote = (await res.json()) as StoreSnapshot;
        if (cancelled) return;
        const local = readCache();
        const merged = mergeSnapshots(local, {
          boxes: remote.boxes,
          counters: { ...emptyCounters(), ...remote.counters },
        });
        apply(merged);
        setOffline(false);

        if (local && localHasRealRemoteLacks(local, remote)) {
          try {
            await fetch("/api/boxes", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(merged),
            });
          } catch {
            // phone copy is already saved
          }
        }
      } catch {
        if (!cancelled) setOffline(true);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apply]);

  const getBox = useCallback(
    (code: string) => data.boxes.find((b) => codesMatch(b.code, code)),
    [data.boxes],
  );

  const peekNextCode = useCallback(
    (room: CreateBoxInput["room"]) => peekNext(room, data.counters),
    [data.counters],
  );

  const createBox = useCallback(
    async (input: CreateBoxInput) => {
      const room = input.room.trim().toUpperCase();
      const predicted =
        (input.code ? normalizeCode(input.code) : null) ??
        peekNext(room, data.counters);
      const now = new Date().toISOString();
      const optimistic: Box = {
        code: predicted,
        room,
        items: input.items ?? [],
        notes: input.notes ?? "",
        fragile: Boolean(input.fragile),
        openFirst: Boolean(input.openFirst),
        example: Boolean(input.example),
        createdAt: now,
        updatedAt: now,
      };
      const n = numberFromCode(predicted);
      apply({
        boxes: [...data.boxes, optimistic],
        counters: {
          ...data.counters,
          [room]: Math.max(data.counters[room] ?? 0, n),
        },
      });

      try {
        const res = await fetch("/api/boxes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, room }),
        });
        if (!res.ok) throw new Error(await res.text());
        const created = (await res.json()) as Box;
        apply({
          boxes: [
            ...data.boxes.filter((b) => !codesMatch(b.code, predicted)),
            created,
          ],
          counters: {
            ...data.counters,
            [created.room]: Math.max(
              data.counters[created.room] ?? 0,
              numberFromCode(created.code),
            ),
          },
        });
        setOffline(false);
        return created;
      } catch {
        setOffline(true);
        return optimistic;
      }
    },
    [apply, data.boxes, data.counters],
  );

  const updateBox = useCallback(
    async (code: string, patch: UpdateBoxInput) => {
      const current = data.boxes.find((b) => codesMatch(b.code, code));
      if (!current) throw new Error("Box not found");
      const optimistic: Box = {
        ...current,
        ...patch,
        code: current.code,
        room: current.room,
        updatedAt: new Date().toISOString(),
      };
      apply({
        ...data,
        boxes: data.boxes.map((b) => (codesMatch(b.code, code) ? optimistic : b)),
      });
      try {
        const res = await fetch(`/api/boxes/${encodeURIComponent(current.code)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error(await res.text());
        const saved = (await res.json()) as Box;
        apply({
          ...data,
          boxes: data.boxes.map((b) => (codesMatch(b.code, code) ? saved : b)),
        });
        setOffline(false);
        return saved;
      } catch {
        setOffline(true);
        return optimistic;
      }
    },
    [apply, data],
  );

  const deleteBox = useCallback(
    async (code: string) => {
      apply({
        ...data,
        boxes: data.boxes.filter((b) => !codesMatch(b.code, code)),
      });
      try {
        const res = await fetch(`/api/boxes/${encodeURIComponent(code)}`, {
          method: "DELETE",
        });
        if (!res.ok && res.status !== 404) throw new Error(await res.text());
        setOffline(false);
      } catch {
        setOffline(true);
      }
    },
    [apply, data],
  );

  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    const labels: string[] = [];
    for (const box of data.boxes) {
      for (const item of box.items) {
        const key = item.label.trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        labels.push(item.label.trim());
      }
    }
    return labels;
  }, [data.boxes]);

  const value = useMemo<BoxStoreValue>(
    () => ({
      boxes: data.boxes,
      counters: data.counters,
      ready,
      offline,
      getBox,
      peekNextCode,
      createBox,
      updateBox,
      deleteBox,
      suggestions,
    }),
    [
      data.boxes,
      data.counters,
      ready,
      offline,
      getBox,
      peekNextCode,
      createBox,
      updateBox,
      deleteBox,
      suggestions,
    ],
  );

  return (
    <BoxStoreContext.Provider value={value}>{children}</BoxStoreContext.Provider>
  );
}

export function useBoxStore() {
  const ctx = useContext(BoxStoreContext);
  if (!ctx) throw new Error("useBoxStore must be used inside BoxStoreProvider");
  return ctx;
}
