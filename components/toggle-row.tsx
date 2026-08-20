"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function ToggleRow({
  checked,
  onCheckedChange,
  title,
  hint,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  title: string;
  hint?: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 text-left",
        className,
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        {hint ? (
          <span className="block text-sm text-muted-foreground">{hint}</span>
        ) : null}
      </span>
    </label>
  );
}
