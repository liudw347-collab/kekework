import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppDataProvider } from "@/context/AppDataContext";

export const metadata: Metadata = {
  title: "可可的工作台 ☁️",
  description: "个人工具网站 - 倒数日、刷题、生活记录一站式（云端同步）",
  keywords: ["倒数日", "刷题", "经期记录", "待办清单", "个人工具", "云端同步"],
  authors: [{ name: "可可老师" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "可可工作台",
  },
  openGraph: {
    title: "可可的工作台",
    description: "个人工具网站 - 倒数日、刷题、生活记录一站式",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#D4A5A5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // iOS PWA 全屏相关
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* iOS PWA 必需的 meta 标签 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="可可工作台" />
        <meta name="format-detection" content="telephone=no" />
        {/* iOS 应用图标 */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* 启动画面（可选） */}
        <link rel="apple-touch-startup-image" href="/icon-512.png" />
      </head>
      <body className="antialiased bg-background text-foreground min-h-screen">
        <AppDataProvider>{children}</AppDataProvider>
        <Toaster />
      </body>
    </html>
  );
}
