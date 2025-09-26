import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'hybrid', // Enable both static and server rendering
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  }),
  integrations: [
    react({
      // Enable React islands architecture
      include: ['**/*.tsx', '**/*.jsx'],
      experimentalReactChildren: true,
    }),
    tailwind({
      // Configure Tailwind for Astro
      applyBaseStyles: false,
    }),
  ],
  experimental: {
    // Enable React 19 support
    react: {
      experimentalReactChildren: true,
    },
  },
  vite: {
    // Optimize for Cloudflare Pages
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            'query-vendor': ['@tanstack/react-query'],
          },
        },
      },
    },
  },
  // Cloudflare Pages configuration
  build: {
    format: 'file', // Ensure compatibility with Cloudflare Pages
  },
});
