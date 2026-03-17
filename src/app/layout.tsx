import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </body>
    </html>
  );
}
