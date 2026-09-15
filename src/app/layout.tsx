import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Vellum — Meet characters worth talking to",
    template: "%s · Vellum",
  },
  description:
    "Discover AI personalities, start conversations, and create characters of your own on Vellum.",
  keywords: [
    "AI chat",
    "AI characters",
    "roleplay",
    "character chat",
    "Vellum",
  ],
  authors: [{ name: "Vellum" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    siteName: "Vellum",
    title: "Vellum — Meet characters worth talking to",
    description:
      "Discover AI personalities, start conversations, and create characters of your own.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vellum — Meet characters worth talking to",
    description:
      "Discover AI personalities, start conversations, and create characters of your own.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
