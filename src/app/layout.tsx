import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { Header } from "@/components/layout/header";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Marketplace", template: "%s | Marketplace" },
  description: "Discover great local deals and sell what you no longer need.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexSans.className} h-full antialiased`}
    >
      <body className="min-h-full text-foreground">
        <Header />
        {children}
      </body>
    </html>
  );
}
