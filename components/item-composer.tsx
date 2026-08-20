"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ItemComposer({
  suggestions,
  onAdd,
  placeholder = "What’s in the box?",
}: {
  suggestions: string[];
  onAdd: (label: string) => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (q.length < 1) return suggestions.slice(0, 6);
    return suggestions
      .filter((s) => s.toLowerCase().includes(q) && s.toLowerCase() !== q)
      .slice(0, 6);
  }, [suggestions, value]);

  function submit(label = value) {
    const text = label.trim();
    if (!text) return;
    onAdd(text);
    setValue("");
  }

  return (
    <div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="done"
          className="h-14 min-h-14 text-base"
        />
        <Button type="submit" className="size-14 shrink-0" aria-label="Add item">
          <Plus className="size-5" />
        </Button>
      </form>
      {matches.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {matches.map((s) => (
            <Badge
              key={s}
              variant="outline"
              asChild
              className="h-10 cursor-pointer px-3 text-sm font-medium"
            >
              <button type="button" onClick={() => submit(s)}>
                {s}
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
