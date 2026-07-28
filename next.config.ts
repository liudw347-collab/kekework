import type { NextConfig } from "next";

/**
 * 可可的工作台 - Next.js 配置
 *
 * 部署到 Cloudflare Pages 时使用静态导出 (output: "export")
 * - 构建命令：npx next build
 * - 输出目录：out
 * - 所有数据通过 localStorage 持久化，无需后端
 *
 * 注意：静态导出不支持 API Routes，已移除 src/app/api/ 目录
 */
const nextConfig: NextConfig = {
  output: "export",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  // 确保静态资源路径在 Cloudflare Pages 子路径下也能正常工作
  trailingSlash: true,
};

export default nextConfig;
