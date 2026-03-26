import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "herosense aqualarm — Smart Water Leak Detection",
  description:
    "Real-time water leak detection and monitoring dashboard for smart buildings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="h-full bg-white font-sans text-slate-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
