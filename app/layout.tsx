import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit, Share_Tech_Mono, Syne } from "next/font/google";
import "./globals.css";
import "./experience.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-face",
});

const mono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mono-face",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-syne",
});

export const metadata: Metadata = {
  title: "Welcome",
  description: "Something your students made for you.",
};

export const viewport: Viewport = {
  themeColor: "#070708",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${display.variable} ${mono.variable} ${syne.variable} dark h-full antialiased`}
    >
      <body className="min-h-dvh bg-[#070708] text-[#f4f0e6]">
        {children}
        <noscript>
          This experience runs in the browser. Turn on JavaScript to enter.
        </noscript>
      </body>
    </html>
  );
}
