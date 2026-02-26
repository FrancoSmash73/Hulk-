import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HulkPhone - ViciDial WebPhone",
  description:
    "Hulk-themed WebRTC softphone for ViciDial AGC agents. Open source, no backdoors, anime style.",
  keywords: ["vicidial", "webphone", "webrtc", "sip", "softphone", "hulk"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistMono.variable} antialiased`}
        style={{
          background: "var(--hulk-bg)",
          color: "var(--hulk-text)",
          fontFamily: "var(--font-geist-mono), 'Courier New', monospace",
          margin: 0,
          padding: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}
