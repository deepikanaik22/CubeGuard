/** @type {import('next').NextConfig} */
const nextConfig = {
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
    // More comprehensive list for OpenTelemetry and related dependencies
    // to be treated as external on the server, reducing bundling conflicts.
    serverComponentsExternalPackages: [
        '@opentelemetry/api',
        '@opentelemetry/core',
        '@opentelemetry/exporter-trace-otlp-http',
        '@opentelemetry/resources',
        '@opentelemetry/sdk-trace-base',
        '@opentelemetry/sdk-trace-node',
        '@opentelemetry/semantic-conventions',
        '@opentelemetry/instrumentation',
        '@opentelemetry/context-async-hooks', // Specifically this one
        'google-auth-library',
        'protobufjs', // Often a dependency that can cause issues if bundled incorrectly
        // Add any other packages that might be causing resolution issues for Node.js built-ins
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    config.experiments = { ...config.experiments, topLevelAwait: true };

    if (!isServer) {
      // Fallbacks for browser environment for Node.js core modules
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        'async_hooks': false, // Crucial for client-side
        'child_process': false,
        'crypto': false,
        'fs': false,
        'http': false,
        'https': false,
        'net': false,
        'os': false,
        'path': false,
        'stream': false,
        'tls': false,
        'util': false,
        'zlib': false,
      };
    }
    // No need to add 'async_hooks' to externals for server-side here if
    // serverComponentsExternalPackages is correctly configured.
    // Next.js should handle Node.js built-ins correctly on the server.

    return config;
  },
};

export default nextConfig;
