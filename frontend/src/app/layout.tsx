import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
