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

    // Provide fallbacks for Node.js core modules that might be imported
    // by dependencies but are not available in the browser environment.
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        'async_hooks': false, // Explicitly tell webpack not to resolve this module on the client
        'fs': false,          // Example: Exclude 'fs' if needed
        'net': false,         // Example: Exclude 'net' if needed
        'tls': false,         // Example: Exclude 'tls' if needed
        // Add other Node.js modules here if they cause issues
      };
    }

    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
