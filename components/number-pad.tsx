"use client";

import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "back", "0", "go"] as const;

export function NumberPad({
  onDigit,
  onBack,
  onGo,
}: {
  onDigit: (d: string) => void;
  onBack: () => void;
  onGo: () => void;
}) {
  return (
    <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
      {KEYS.map((key) => {
        if (key === "back") {
          return (
            <Button
              key={key}
              type="button"
              variant="ghost"
              aria-label="Delete last digit"
              onClick={onBack}
              className="h-14 min-h-14"
            >
              <Delete className="size-5" />
            </Button>
          );
        }
        if (key === "go") {
          return (
            <Button
              key={key}
              type="button"
              onClick={onGo}
              className="h-14 min-h-14 text-base"
            >
              Go
            </Button>
          );
        }
        return (
          <Button
            key={key}
            type="button"
            variant="outline"
            onClick={() => onDigit(key)}
            className="h-14 min-h-14 font-mono text-xl font-medium"
          >
            {key}
          </Button>
        );
      })}
    </div>
  );
}
