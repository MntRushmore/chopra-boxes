import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { codesMatch, formatCode, normalizeCode, numberFromCode, parseCode } from "@/lib/codes";
import { seedSnapshot } from "@/lib/seed";
import {
  emptyCounters,
  type Box,
  type CreateBoxInput,
  type StoreSnapshot,
  type UpdateBoxInput,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "boxes.json");
const STORE_KEY = "chopra-boxes:v1";

let memoryStore: StoreSnapshot | null = null;

function redisEnabled() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  );
}

async function getRedis() {
  if (!redisEnabled()) return null;
  const { Redis } = await import("@upstash/redis");
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return Redis.fromEnv();
  }
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
  return null;
}

function findBox(data: StoreSnapshot, raw: string) {
  return data.boxes.find((b) => codesMatch(b.code, raw));
}

function findBoxIndex(data: StoreSnapshot, raw: string) {
  return data.boxes.findIndex((b) => codesMatch(b.code, raw));
}

function bumpCounters(data: StoreSnapshot) {
  const counters = { ...emptyCounters(), ...data.counters };
  for (const box of data.boxes) {
    const n = numberFromCode(box.code);
    const room = box.room.toUpperCase();
    if (n > (counters[room] ?? 0)) counters[room] = n;
  }
  data.counters = counters;
  return data;
}

function normalizeSnapshot(input: StoreSnapshot): StoreSnapshot {
  return bumpCounters({
    boxes: Array.isArray(input.boxes) ? input.boxes : [],
    counters: { ...emptyCounters(), ...input.counters },
  });
}

/** Never throw — Vercel serverless FS is often read-only. */
async function persistFile(data: StoreSnapshot) {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
  } catch {
    // keep going with in-memory / seed
  }
}

async function readFileStore(): Promise<StoreSnapshot> {
  if (memoryStore) return bumpCounters(memoryStore);
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoreSnapshot;
    if (!parsed.boxes) throw new Error("bad store");
    memoryStore = normalizeSnapshot(parsed);
    return memoryStore;
  } catch {
    const seeded = seedSnapshot();
    memoryStore = seeded;
    await persistFile(seeded);
    return seeded;
  }
}

async function readStore(): Promise<StoreSnapshot> {
  const redis = await getRedis();
  if (redis) {
    const existing = await redis.get<StoreSnapshot>(STORE_KEY);
    if (existing?.boxes) {
      memoryStore = bumpCounters(existing);
      return memoryStore;
    }
    const seeded = seedSnapshot();
    memoryStore = seeded;
    await redis.set(STORE_KEY, seeded);
    return seeded;
  }
  return readFileStore();
}

async function writeStore(data: StoreSnapshot) {
  memoryStore = data;
  const redis = await getRedis();
  if (redis) {
    await redis.set(STORE_KEY, data);
    return;
  }
  await persistFile(data);
}

let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export const boxStore = {
  list(): Promise<StoreSnapshot> {
    return serialize(async () => readStore());
  },

  get(code: string): Promise<Box | null> {
    return serialize(async () => {
      const data = await readStore();
      return findBox(data, code) ?? null;
    });
  },

  replace(snapshot: StoreSnapshot): Promise<StoreSnapshot> {
    return serialize(async () => {
      const next = normalizeSnapshot(snapshot);
      await writeStore(next);
      return next;
    });
  },

  create(input: CreateBoxInput): Promise<Box> {
    return serialize(async () => {
      const data = await readStore();
      const now = new Date().toISOString();
      const room = input.room.trim().toUpperCase();
      let code = input.code ? input.code.toUpperCase() : undefined;
      if (code) {
        const parsed = parseCode(code);
        if (!parsed || parsed.room !== room) {
          throw new Error("Invalid code for that room");
        }
        if (data.boxes.some((b) => codesMatch(b.code, code!))) {
          throw new Error("That code is already used");
        }
        code = formatCode(parsed.room, parsed.n);
        if (parsed.n > (data.counters[room] ?? 0)) {
          data.counters[room] = parsed.n;
        }
      } else {
        const n = (data.counters[room] ?? 0) + 1;
        data.counters[room] = n;
        code = formatCode(room, n);
      }

      const box: Box = {
        code,
        room,
        items: input.items ?? [],
        notes: input.notes ?? "",
        fragile: Boolean(input.fragile),
        openFirst: Boolean(input.openFirst),
        example: Boolean(input.example),
        createdAt: now,
        updatedAt: now,
      };
      data.boxes.push(box);
      await writeStore(data);
      return box;
    });
  },

  update(code: string, patch: UpdateBoxInput): Promise<Box> {
    return serialize(async () => {
      const data = await readStore();
      const index = findBoxIndex(data, code);
      if (index === -1) throw new Error("Box not found");
      const next: Box = {
        ...data.boxes[index],
        ...patch,
        code: data.boxes[index].code,
        room: data.boxes[index].room,
        createdAt: data.boxes[index].createdAt,
        updatedAt: new Date().toISOString(),
      };
      data.boxes[index] = next;
      await writeStore(data);
      return next;
    });
  },

  delete(code: string): Promise<void> {
    return serialize(async () => {
      const data = await readStore();
      const target = normalizeCode(code) ?? code.trim().toUpperCase();
      const next = data.boxes.filter((b) => !codesMatch(b.code, target));
      if (next.length === data.boxes.length) throw new Error("Box not found");
      data.boxes = next;
      await writeStore(data);
    });
  },
};
