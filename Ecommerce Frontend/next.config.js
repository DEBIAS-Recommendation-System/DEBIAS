/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV !== "development", // Remove console.log in production
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@/components', '@/lib', '@/utils'],
    // Disable CSS optimization that requires critters module
    // optimizeCss: true,
    turbo: {
      resolveAlias: {
        'stream': 'stream-browserify',
      },
    },
  },
  // Enable SWC minification for faster builds
  swcMinify: true,
  // Production optimizations
  reactStrictMode: true,
  // Optimize output
  compress: true,
  // Optimize images
  optimizeFonts: true,
  // Reduce bundle size
  modularizeImports: {
    '@/components': {
      transform: '@/components/{{member}}',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bbebbirskpjukxmqvcup.supabase.co",
        port: "",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "cloudflare-ipfs.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
        pathname: "/**",
      },
    ],
  },
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: "canvas" }];
    // resolve configuration
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        stream: "stream-browserify",
      },
    };
    return config;
  },
};

// const withPWA = require("next-pwa")({
//   dest: "public/PWA",
// });

module.exports =
  process.env.NODE_ENV === "development" ? nextConfig : nextConfig; // withPWA(nextConfig);
