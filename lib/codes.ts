import type { Counters } from "@/lib/types";

const CODE_RE = /^([A-Z]{2,3})-(\d{1,3})$/;
const PREFIX_RE = /^[A-Z]{2,3}$/;
const LOOSE_CODE_RE = /([A-Z]{2,3})\s*-\s*(\d{1,3})/g;

export function isPrefix(value: string): boolean {
  return PREFIX_RE.test(value.trim().toUpperCase());
}

export function normalizePrefix(raw: string): string | null {
  const text = raw.trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (!PREFIX_RE.test(text)) return null;
  return text;
}

export function formatCode(room: string, n: number) {
  return `${room.toUpperCase()}-${String(n).padStart(2, "0")}`;
}

export function nextCode(room: string, counters: Counters) {
  const prefix = room.toUpperCase();
  return formatCode(prefix, (counters[prefix] ?? 0) + 1);
}

export function parseCode(raw: string): { room: string; n: number } | null {
  const text = raw.trim().toUpperCase();
  const match = CODE_RE.exec(text);
  if (!match) return null;
  const room = match[1];
  const n = Number.parseInt(match[2], 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return { room, n };
}

export function normalizeCode(raw: string) {
  const parsed = parseCode(raw);
  if (!parsed) return null;
  return formatCode(parsed.room, parsed.n);
}

export function numberFromCode(code: string) {
  const parsed = parseCode(code);
  return parsed?.n ?? 0;
}

/** Find the first valid box code in OCR / typed text. Spaces around the hyphen are ok. */
export function extractCode(raw: string): string | null {
  const upper = raw.toUpperCase();
  const compact = parseCode(upper.replace(/\s+/g, ""));
  if (compact) return formatCode(compact.room, compact.n);

  const exact = parseCode(upper);
  if (exact) return formatCode(exact.room, exact.n);

  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const match of upper.matchAll(LOOSE_CODE_RE)) {
    const n = Number.parseInt(match[2], 10);
    if (!Number.isFinite(n) || n < 1) continue;
    const code = formatCode(match[1], n);
    if (seen.has(code)) continue;
    seen.add(code);
    candidates.push(code);
  }
  return candidates[0] ?? null;
}

export function codesMatch(a: string, b: string) {
  const left = normalizeCode(a) ?? a.trim().toUpperCase();
  const right = normalizeCode(b) ?? b.trim().toUpperCase();
  return left === right;
}
