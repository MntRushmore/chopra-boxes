import { cn } from "@/lib/utils";

export function PageEnter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <main className={cn(className)}>{children}</main>;
}
