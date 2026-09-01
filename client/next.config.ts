import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      // Google OAuth avatars (lh3.googleusercontent.com / lh4, lh5...)
      {
        protocol: "https",
        hostname: "lh*.googleusercontent.com",
        pathname: "/**",
      },
      // Cloudinary-hosted avatars (default avatar + user uploads)
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
