import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicons/*"],
      manifest: {
        name: "Aegis Flow",
        short_name: "Aegis Flow",
        description: "Personal management dashboard for elite performance",
        theme_color: "#0a0a0f",
        background_color: "#0a0a0f",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "favicons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "favicons/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,json,png,svg,ico}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB — singlefile inlines everything into index.html
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts", expiration: { maxEntries: 10, maxAgeSeconds: 86400 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
