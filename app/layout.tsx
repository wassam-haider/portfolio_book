import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, IM_Fell_English, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const fellEnglish = IM_Fell_English({
  variable: "--font-fell-english",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Archives of Wassam Haider",
  description:
    "A chronicle of code, creation & discovery — an interactive ancient book of software projects, guarded by S.H.E.A., the keeper of the archives.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* suppressHydrationWarning: some browser extensions (e.g. accessibility/
          recording tools) inject attributes like data-scribe-recorder-ready
          onto <html> before React hydrates, which would otherwise log a
          harmless hydration warning that has nothing to do with our markup. */}
      <body
        className={`${cinzel.variable} ${cormorant.variable} ${fellEnglish.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
