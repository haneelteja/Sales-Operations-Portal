import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
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
          // UI libraries are fine
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-alert-dialog",
          ],

          // Supabase client
          "supabase-vendor": ["@supabase/supabase-js"],

          // Forms
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],

          // Utilities
          "utils-vendor": ["date-fns", "clsx", "tailwind-merge"],

          // Charts
          "charts-vendor": ["recharts"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: true,
  },
}));
