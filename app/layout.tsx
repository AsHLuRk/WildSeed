import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

// next/font variables are named --nf-* so they don't clash with Tailwind's --font-* theme tokens.
const display = Fraunces({
  subsets: ["latin"],
  variable: "--nf-display",
  display: "swap",
  style: ["normal", "italic"],
});
const body = DM_Sans({ subsets: ["latin"], variable: "--nf-body", display: "swap" });

export const metadata: Metadata = {
  title: "Wildseed | Growth marketing studio (sample site)",
  description: "A fictional growth marketing studio. Sample site with a scroll-driven seed-to-bloom animation.",
};

export const viewport: Viewport = {
  themeColor: "#F7F3EC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
