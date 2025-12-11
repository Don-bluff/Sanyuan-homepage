/** @type {import('next').NextConfig} */
const nextConfig = {
  // 添加空的turbopack配置以兼容Next.js 16
  turbopack: {},
  // 静态导出优化
  trailingSlash: true,
  // 图片优化
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
