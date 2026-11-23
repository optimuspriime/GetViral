import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { DataProvider } from "@/components/data-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mosaic — Creator intelligence",
  description: "Discover, compare, and organize creators for your next campaign.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <DataProvider>
          <AppShell>{children}</AppShell>
        </DataProvider>
      </body>
    </html>
  );
}
