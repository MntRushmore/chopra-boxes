import { NextResponse } from "next/server";
import { normalizeCode } from "@/lib/codes";
import { boxStore } from "@/lib/server-store";
import type { UpdateBoxInput } from "@/lib/types";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ code: string }> };

export async function GET(_request: Request, ctx: RouteCtx) {
  const { code: raw } = await ctx.params;
  const code = normalizeCode(decodeURIComponent(raw));
  if (!code) return NextResponse.json({ error: "Bad code" }, { status: 400 });
  const box = await boxStore.get(code);
  if (!box) return NextResponse.json({ error: "No box with that code" }, { status: 404 });
  return NextResponse.json(box);
}

export async function PUT(request: Request, ctx: RouteCtx) {
  const { code: raw } = await ctx.params;
  const code = normalizeCode(decodeURIComponent(raw));
  if (!code) return NextResponse.json({ error: "Bad code" }, { status: 400 });
  try {
    const patch = (await request.json()) as UpdateBoxInput;
    const box = await boxStore.update(code, patch);
    return NextResponse.json(box);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, ctx: RouteCtx) {
  const { code: raw } = await ctx.params;
  const code = normalizeCode(decodeURIComponent(raw));
  if (!code) return NextResponse.json({ error: "Bad code" }, { status: 400 });
  try {
    await boxStore.delete(code);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
