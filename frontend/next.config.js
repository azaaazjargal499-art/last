import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfig} */
const createNextConfig = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    reactStrictMode: true,
    distDir: isDev ? '.next-dev' : '.next',
    output: isDev ? undefined : 'standalone',
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.API_PROXY_URL || 'http://localhost:5000'}/api/:path*`,
        },
      ];
    },
  };
};

export default createNextConfig;
