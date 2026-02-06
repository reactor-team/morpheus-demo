import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morpheus Disguise | Reactor",
  description:
    "Real-time identity transformation powered by AI. Clone any person and become them with Morpheus video model.",
  keywords: [
    "AI",
    "video",
    "transformation",
    "disguise",
    "real-time",
    "Reactor",
  ],
  openGraph: {
    title: "Morpheus Disguise | Reactor",
    description: "Real-time identity transformation powered by AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
