import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "可可的工作台 ☁️",
  description: "可可老师的个人工具网站 - 备考、刷题、生活记录一站式",
  keywords: ["教师编备考", "刷题", "经期记录", "待办清单", "个人工具"],
  authors: [{ name: "可可老师" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "可可工作台",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5E1DA",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
