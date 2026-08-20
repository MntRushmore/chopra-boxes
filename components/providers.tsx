"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { BoxStoreProvider } from "@/lib/client-store";
import { PwaRegister } from "@/components/pwa-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <BoxStoreProvider>
        <PwaRegister />
        {children}
        <Toaster position="top-center" />
      </BoxStoreProvider>
    </ThemeProvider>
  );
}
