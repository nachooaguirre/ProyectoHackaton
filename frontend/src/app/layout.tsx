import type { Metadata } from "next";
import Link from "next/link";
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

export const metadata: Metadata = {
  title: "MoviesExpress",
  description: "MoviesExpress - recomendaciones personalizadas de películas",
  icons: {
    icon: [
      "/icons/ChatGPT%20Image%209%20sept%202025,%2009_58_49%20p.m..png",
      { url: "/icons/ChatGPT%20Image%209%20sept%202025,%2009_58_49%20p.m..png", sizes: "32x32", type: "image/png" },
      { url: "/icons/ChatGPT%20Image%209%20sept%202025,%2009_58_49%20p.m..png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/icons/ChatGPT%20Image%209%20sept%202025,%2009_58_49%20p.m..png",
    shortcut: "/icons/ChatGPT%20Image%209%20sept%202025,%2009_58_49%20p.m..png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
