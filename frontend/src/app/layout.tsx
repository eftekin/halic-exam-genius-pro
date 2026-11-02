import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "Haliç Exam Genius | Haliç Üniversitesi Sınav Programı Oluşturucu",
  description:
    "A specialized tool for 3000+ students to generate, export, and manage their final exam schedules instantly.",
  keywords: [
    "halic exam genius",
    "haliç üniversitesi sınav programı",
    "haliç sınav takvimi",
    "haliç exam schedule",
    "haliç university exam",
    "sınav programı oluşturucu",
  ],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Haliç Exam Genius | Haliç Üniversitesi Sınav Programı Oluşturucu",
    description:
      "A specialized tool for 3000+ students to generate, export, and manage their final exam schedules instantly.",
    url: "https://halicexamgenius.com/",
    siteName: "Haliç Exam Genius",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Haliç Exam Genius | Haliç Üniversitesi Sınav Programı Oluşturucu",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Haliç Exam Genius | Haliç Üniversitesi Sınav Programı Oluşturucu",
    description:
      "A specialized tool for 3000+ students to generate, export, and manage their final exam schedules instantly.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plexSans.variable} ${plexMono.variable} antialiased`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
