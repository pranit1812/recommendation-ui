/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_GRAPH_RAG: process.env.NEXT_PUBLIC_GRAPH_RAG || 'https://query-mod-dev.hyperwaterbids.com/query',
    NEXT_PUBLIC_CHAT_SOURCE_BUCKET: process.env.NEXT_PUBLIC_CHAT_SOURCE_BUCKET || 'itb-store-dev',
  },
}

module.exports = nextConfig 