import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
  plugins: [react()],

  // Performance optimizations
  build: {
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["wouter"],
          query: ["@tanstack/react-query"],
          ui: ["lucide-react"],
        },
      },
    },

    // Compression
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },

    // Asset optimization
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
  },

  // Development optimizations
  server: {
    hmr: {
      overlay: false,
    },
  },

  // Path resolution
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@/components": resolve(__dirname, "src/components"),
      "@/hooks": resolve(__dirname, "src/hooks"),
      "@/lib": resolve(__dirname, "src/lib"),
      "@/pages": resolve(__dirname, "src/pages"),
    },
  },

  // Environment variables
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
  },
})
