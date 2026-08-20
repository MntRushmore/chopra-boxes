import { cn } from "@/lib/utils";

export function CodeMark({
  code,
  room: _room,
  size = "lg",
  className,
}: {
  code: string;
  room?: string;
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
}) {
  const sizes = {
    sm: "text-lg",
    md: "text-3xl",
    lg: "text-5xl",
    hero: "text-6xl sm:text-7xl",
  };

  return (
    <p
      className={cn(
        "font-mono font-bold tracking-tight text-foreground",
        sizes[size],
        className,
      )}
    >
      {code}
    </p>
  );
}
