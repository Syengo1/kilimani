import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

// 1. Premium Typography Integration
// Inter is the gold standard for highly legible, dense data dashboards
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// 2. Enterprise Metadata Setup
export const metadata: Metadata = {
  title: {
    template: "%s | Kilimani Hair",
    default: "Kilimani Hair | Internal Terminal Core",
  },
  description: "Secure administrative dashboard and inventory management system for Kilimani Hair.",
  applicationName: "Kilimani Terminal",
};

// 3. Strict Viewport Control
// Prevents iOS Safari from auto-zooming when cashiers tap on input fields
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FCFBF9" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A09" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning is CRITICAL here. 
    // It prevents React from crashing when next-themes injects the dynamic theme attribute.
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* ThemeProvider acts as our dynamic style engine.
          It listens for theme changes and updates the data-theme attribute natively.
        */}
        <ThemeProvider 
          attribute="data-theme" 
          defaultTheme="sleek-dark" 
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}