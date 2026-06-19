"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider 
      // STRICT ENFORCEMENT: Guarantees next-themes uses <html class="dark">
      attribute="class" 
      defaultTheme="system" 
      enableSystem 
      disableTransitionOnChange={false} // Ensures our 0.5s CSS fade works beautifully
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}