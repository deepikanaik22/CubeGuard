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
    // allowedDevOrigins is deprecated, use cors instead if needed, but likely not necessary for this error
    // allowedDevOrigins: ['3001-idx-studio-1745413977913.cluster-zkm2jrwbnbd4awuedc2alqxrpk.cloudworkstations.dev'],
    serverComponentsExternalPackages: ['@opentelemetry/sdk-trace-node'], // Hint for Next.js bundler
  },
  // Add webpack configuration to handle 'async_hooks'
  webpack: (config, { isServer }) => {
    // Exclude 'async_hooks' from the client bundle
    if (!isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
         // Add async_hooks as external for client-side builds
        config.externals.push('async_hooks');
      } else if (typeof config.externals === 'object') {
         // Handle object externals if necessary, though array is common
        (config.externals as Record<string, any>)['async_hooks'] = 'var {}'; // Provide an empty object mock
      }
      // You might also need to provide fallbacks for other Node.js modules if errors occur
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        'async_hooks': false, // Explicitly tell webpack not to resolve this module on the client
        'fs': false,
        'net': false,
        'tls': false,
      };
    }

    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
