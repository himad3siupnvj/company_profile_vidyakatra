/** @type {import('next').NextConfig} */
const remoteImageHostnames = [
  process.env.SUPABASE_URL,
  "https://images.unsplash.com",
]
  .filter(Boolean)
  .map((url) => {
    try {
      return new URL(url).hostname
    } catch {
      return null
    }
  })
  .filter(Boolean)

const nextConfig = {
  serverExternalPackages: ["pdf-parse"],
  images: {
    remotePatterns: remoteImageHostnames.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
    unoptimized: true,
  },
}

export default nextConfig
