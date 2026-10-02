import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Motion Charts — Product data in motion",
  description: "Accessible, animation-first React SVG charts powered by Framer Motion."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
