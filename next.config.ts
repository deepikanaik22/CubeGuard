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
    serverComponentsExternalPackages: ['@opentelemetry/sdk-trace-node'], // Keep existing if still needed
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

    // This part might be necessary if 'async_hooks' is somehow still being
    // processed despite the fallback. It defines 'async_hooks' as an external
    // module that won't be bundled.
    // config.externals = config.externals || [];
    // if (!isServer) {
    //   if (Array.isArray(config.externals)) {
    //     config.externals.push('async_hooks');
    //   } else {
    //      // Handle object externals if necessary
    //      (config.externals as Record<string, any>)['async_hooks'] = 'var {}';
    //   }
    // }

    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
