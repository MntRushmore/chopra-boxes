"use client";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/sheet";

type AlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
};

function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Keep it",
  destructive = true,
  onConfirm,
}: AlertDialogProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title}>
      <p className="text-lg leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="secondary" className="h-14 min-h-14 text-base" onClick={() => onOpenChange(false)}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? "destructive" : "default"}
          className="h-14 min-h-14 text-base"
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}

export { AlertDialog };
