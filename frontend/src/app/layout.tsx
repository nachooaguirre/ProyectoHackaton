import type { Metadata } from "next";
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
        <header style={{ position: 'sticky', top: 0, zIndex: 10, padding: '8px 20px' }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/ChatGPT%20Image%209%20sept%202025,%2009_58_49%20p.m..png" alt="MoviesExpress" width={44} height={44} />
            
          </a>
        </header>
        {children}
      </body>
    </html>
  );
}
