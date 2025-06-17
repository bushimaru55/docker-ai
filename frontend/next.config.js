/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // 開発環境でのTypeScriptエラーを一時的に無視
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLintエラーも一時的に無視
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 