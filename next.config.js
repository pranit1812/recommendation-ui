/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_CHAT_SOURCE_BUCKET: process.env.NEXT_PUBLIC_CHAT_SOURCE_BUCKET || 'itb-store-dev',
  },
}

module.exports = nextConfig 