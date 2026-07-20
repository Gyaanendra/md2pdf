/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.watchOptions = {
      ignored: ["**/.git/**", "**/node_modules/**", "**/.next/**"],
    };
    return config;
  },
};

export default nextConfig;
