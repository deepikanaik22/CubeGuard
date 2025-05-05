import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // Ensure serverComponentsExternalPackages includes packages needed by Genkit/Telemetry
    // Add @opentelemetry/context-async-hooks as it seems to be the direct dependency causing the issue
    serverComponentsExternalPackages: ['@opentelemetry/sdk-trace-node', '@opentelemetry/context-async-hooks'],
  },
  // Add webpack configuration to handle 'async_hooks' and other Node.js modules
  webpack: (config, { isServer, webpack }) => {
    // Ensure experiments.topLevelAwait is enabled for potential async operations during module loading
    config.experiments = { ...config.experiments, topLevelAwait: true };

    // Handle Node.js core modules
    if (!isServer) {
      // Provide fallbacks for browser environment
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        'async_hooks': false,
        'fs': false,
        'net': false,
        'tls': false,
      };
    }
    // No specific server-side externals needed for 'async_hooks' here,
    // as the issue seems related to client-side bundling or server component externalization.
    // The serverComponentsExternalPackages should handle server-side availability.

    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
