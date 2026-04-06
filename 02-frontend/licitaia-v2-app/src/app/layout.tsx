import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthBootstrap } from "@/components/auth-bootstrap";
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
  title: "LICITAIA V2",
  description: "Motor de conformidade administrativa preventiva",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthBootstrap>{children}</AuthBootstrap>
      </body>
    </html>
  );
}
