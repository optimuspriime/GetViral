import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { DataProvider } from "@/components/data-provider";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://get-viral.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GetViral — Creator Discovery & Campaign CRM",
    template: "%s | GetViral",
  },
  description:
    "Search YouTube and Twitch creators live, look up Kick channel handles, and manage campaign partnerships with verified metrics and provenance.",
  openGraph: {
    type: "website",
    siteName: "GetViral",
    title: "GetViral — Creator Discovery & Campaign CRM",
    description:
      "Search YouTube and Twitch live, look up Kick channel handles, and organize creator partnerships in one workspace.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "GetViral — Creator Discovery & Campaign CRM",
    description:
      "Search YouTube and Twitch live, look up Kick channel handles, and organize creator partnerships.",
  },
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
