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

    if (isServer) {
      // Ensure 'async_hooks' and other problematic Node.js built-ins are treated as external
      // This helps prevent "Module not found" errors for these modules on the server.
      const currentExternals = Array.isArray(config.externals) ? config.externals : [];
      config.externals = [
        ...currentExternals,
        // Add Node.js built-ins that might be causing issues if bundled
        'async_hooks',
        // 'child_process', // Add others if similar errors appear
        // 'crypto',
        // 'fs',
        // 'http',
        // 'https',
        // 'net',
        // 'os',
        // 'path',
        // 'stream',
        // 'tls',
        // 'util',
        // 'zlib',
      ];
    } else {
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
    return config;
  },
};

export default nextConfig;
