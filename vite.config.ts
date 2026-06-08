import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
    process.env.ANALYZE === "true" && visualizer({ filename: "dist/stats.html", open: true, gzipSize: true, brotliSize: true }),

    // PWA plugin — generates service worker + injects manifest link automatically.
    // Capacitor's WebView also picks up the service worker for offline caching.
    VitePWA({
      registerType: "autoUpdate",

      // Manifest is maintained manually in public/manifest.webmanifest;
      // injectManifest mode lets us write a custom SW while still using Workbox.
      strategies: "generateSW",

      // Tells vite-plugin-pwa where our hand-crafted manifest lives
      manifest: false, // don't auto-generate — we maintain public/manifest.webmanifest

      // Workbox configuration for the generated service worker
      workbox: {
        // Pre-cache the full app shell so it loads offline
        globPatterns: ["**/*.{js,css,html,ico,svg,png,woff2}"],

        // Runtime caching: Supabase API calls → network-first (always fresh data)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 10,
            },
          },
          // Static assets from CDN (fonts, etc.) → CacheFirst
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],

        // Don't cache Supabase auth tokens or edge function calls
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/functions\/v1\//],
      },

      // Dev options — enable the SW in dev so you can test offline behaviour
      devOptions: {
        enabled: false, // flip to true when debugging the service worker locally
        type: "module",
      },

      // Include the webmanifest so the plugin can serve it with the correct MIME type
      includeAssets: [
        "favicon.ico",
        "icons/*.png",
        "icons/*.svg",
        "manifest.webmanifest",
      ],
    }),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom", "@tanstack/react-query"],
  },

  optimizeDeps: {
    exclude: ["react", "react-dom"],
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-alert-dialog",
          ],
          "supabase-vendor": ["@supabase/supabase-js"],
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
          "utils-vendor": ["date-fns", "clsx", "tailwind-merge"],
          "charts-vendor": ["recharts"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: true,
  },
}));
