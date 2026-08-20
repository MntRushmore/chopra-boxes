"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const tap = { scale: 0.975 };
const spring = { type: "spring" as const, stiffness: 520, damping: 34 };

export function Press({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div whileTap={tap} transition={spring} className={cn(className)}>
      {children}
    </motion.div>
  );
}

export function PressButton({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      type="button"
      whileTap={tap}
      transition={spring}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}
