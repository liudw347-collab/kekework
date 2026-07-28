import type { NextConfig } from "next";

/**
 * 可可的工作台 - Next.js 配置
 *
 * 部署到 Cloudflare Pages 时使用静态导出 (output: "export")
 * - 构建命令：npx next build
 * - 输出目录：out
 * - 前端为纯静态 HTML/JS
 * - 后端通过 Cloudflare Pages Functions 提供（functions/api/ 目录）
 * - 数据存储在 Cloudflare D1 数据库，跨设备同步
 *
 * 注意：静态导出不支持 Next.js API Routes (src/app/api/)，
 *       后端逻辑使用 Cloudflare Pages Functions 替代。
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
