import { NextResponse } from "next/server";
import { isPrefix } from "@/lib/codes";
import { seedSnapshot } from "@/lib/seed";
import { boxStore } from "@/lib/server-store";
import type { CreateBoxInput, StoreSnapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await boxStore.list();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(seedSnapshot());
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBoxInput;
    if (!body?.room || !isPrefix(body.room)) {
      return NextResponse.json({ error: "Pick a room." }, { status: 400 });
    }
    const box = await boxStore.create({
      ...body,
      room: body.room.trim().toUpperCase(),
    });
    return NextResponse.json(box, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create box";
    const status = message.includes("already used") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as StoreSnapshot;
    if (!body || !Array.isArray(body.boxes)) {
      return NextResponse.json({ error: "Invalid snapshot" }, { status: 400 });
    }
    const data = await boxStore.replace(body);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save boxes";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
