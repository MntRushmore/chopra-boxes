"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { CodeMark } from "@/components/code-mark";
import { EmptyState } from "@/components/empty-state";
import { ItemComposer } from "@/components/item-composer";
import { PageEnter } from "@/components/page-enter";
import { ToggleRow } from "@/components/toggle-row";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { normalizeCode } from "@/lib/codes";
import { useBoxStore } from "@/lib/client-store";
import { roomMeta } from "@/lib/rooms";
import { newId } from "@/lib/utils";
import type { BoxItem } from "@/lib/types";

export default function BoxDetailPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { getBox, updateBox, deleteBox, suggestions, ready } = useBoxStore();
  const code = normalizeCode(decodeURIComponent(params.code ?? ""));
  const box = code ? getBox(code) : undefined;
  const [confirm, setConfirm] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);

  if (!ready && !box) {
    return (
      <PageEnter>
        <AppHeader title="Box" backHref="/boxes" />
        <p className="text-base text-muted-foreground">Looking it up…</p>
      </PageEnter>
    );
  }

  if (!code || !box) {
    return (
      <PageEnter>
        <AppHeader title="No box" backHref="/find" />
        <EmptyState
          title={`No box ${params.code ?? ""}.`}
          hint="Check the Sharpie code, or create it from New box."
        />
        <Button
          className="mt-4 h-14 min-h-14 w-full text-base"
          onClick={() => router.push("/new")}
        >
          Create a new box
        </Button>
      </PageEnter>
    );
  }

  const current = box;
  const meta = roomMeta(current.room);
  const noteValue = notes ?? current.notes;

  async function setItems(items: BoxItem[]) {
    await updateBox(current.code, { items });
  }

  return (
    <PageEnter>
      <AppHeader title={meta.name} backHref="/boxes" />
      <div className="flex flex-col items-center text-center">
        <CodeMark code={current.code} room={current.room} size="hero" />
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Badge variant="outline">{meta.name}</Badge>
          {current.example ? <Badge variant="secondary">Example</Badge> : null}
          {current.fragile ? (
            <Badge variant="outline">
              <AlertTriangle /> Fragile
            </Badge>
          ) : null}
          {current.openFirst ? (
            <Badge variant="outline">
              <Sparkles /> Open first
            </Badge>
          ) : null}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Inside</h2>
        {current.items.length === 0 ? (
          <EmptyState
            title="Nothing listed yet."
            hint="Add the first thing you remember. You can finish later."
          />
        ) : (
          <ul className="space-y-2">
            {current.items.map((item) => (
              <li key={item.id}>
                <Card>
                  <CardContent className="flex min-h-14 items-center gap-3">
                    <Checkbox
                      checked={item.unpacked}
                      onCheckedChange={(value) =>
                        setItems(
                          current.items.map((it) =>
                            it.id === item.id
                              ? { ...it, unpacked: value === true }
                              : it,
                          ),
                        )
                      }
                    />
                    <label
                      className={
                        item.unpacked
                          ? "flex-1 text-base text-muted-foreground line-through"
                          : "flex-1 text-base font-medium"
                      }
                    >
                      {item.label}
                    </label>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <ItemComposer
            suggestions={suggestions}
            onAdd={(label) =>
              setItems([
                ...current.items,
                { id: newId(), label, unpacked: false },
              ])
            }
          />
        </div>
      </section>

      <Separator className="my-8" />

      <section className="space-y-3">
        <ToggleRow
          checked={current.fragile}
          onCheckedChange={(fragile) => updateBox(current.code, { fragile })}
          title="Fragile"
        />
        <ToggleRow
          checked={current.openFirst}
          onCheckedChange={(openFirst) => updateBox(current.code, { openFirst })}
          title="Open first"
        />
        <Input
          value={noteValue}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => updateBox(current.code, { notes: noteValue })}
          placeholder="Optional note"
          className="h-14 min-h-14 text-base"
        />
      </section>

      <Button
        type="button"
        variant="ghost"
        className="mt-8 h-14 min-h-14 w-full text-destructive"
        onClick={() => setConfirm(true)}
      >
        <Trash2 className="size-4" />
        Delete {current.code}
      </Button>

      <AlertDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Delete ${current.code}?`}
        description="The code will never be reused. This cannot be undone."
        onConfirm={async () => {
          await deleteBox(current.code);
          toast(`Deleted ${current.code}`);
          router.replace("/boxes");
        }}
      />
    </PageEnter>
  );
}
