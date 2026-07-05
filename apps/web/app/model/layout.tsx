import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./v0-theme.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Guma AI-commerce — Shop Live from Your Feed",
  description:
    "Guma AI-commerce is the AI-powered social storefront for Facebook, TikTok & Instagram sellers. Live selling, instant deals, and one-tap checkout.",
  robots: { index: false, follow: true },
};

export default function ModelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`v0-store-root light min-h-screen bg-background font-sans antialiased ${spaceGrotesk.variable} ${inter.variable}`}
    >
      {children}
    </div>
  );
}
