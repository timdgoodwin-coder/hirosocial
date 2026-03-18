import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HiroSocial — Turn Articles Into Social Media Posts",
  description: "Transform any blog post or article into polished, platform-specific social media content for Facebook, Twitter, LinkedIn, Instagram, and Threads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </body>
    </html>
  );
}
