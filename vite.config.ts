import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Tells Vite to look inside Client/Public instead of the default root "public" folder
  publicDir: path.resolve(__dirname, "./Client/Public"),
  
  server: {
    host: "::",
    port: 8080,
    watch: {
      // Prevents Vite from indexing database data and generated RAG artifacts, stopping OOM errors/deadlocks
      ignored: [
        "**/Server/Database/**", 
        "**/Server/Data/RAG/**", 
        "**/Server/Data/Hadith/**" // 🌟 ADDED: Stops Vite from choking on your large dataset
      ],
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      filename: "sw.js",
      devOptions: { enabled: false },
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "Al Deen",
        short_name: "Al Deen",
        description: "Access to Quran, Hadith and etc.",
        theme_color: "#1a1a1a",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,json}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//, /\.[^/]+$/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // 20MB for large chunks
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-navigation-cache",
              networkTimeoutSeconds: 3,
            },
          },
          {
            // Cache JSON data files forever, they rarely change
            urlPattern: /\/(\/Server\/Database)\/.+\.json$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "quran-data-cache",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            // Font files
            urlPattern: /\.(woff2?|ttf|eot)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "font-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
              },
            },
          },
          {
            // Audio files
            urlPattern: /\.mp3$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "audio-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              rangeRequests: true,
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "cdn-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\.alquran\.cloud\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
          {
            // Prayer times API — stale-while-revalidate for fast repeat loads
            urlPattern: /^https:\/\/api\.aladhan\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "prayer-times-cache",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 6, // 6 hours
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: [
      {
        // Matches exact imports starting with 'Client/' to resolve to the Client folder
        find: /^Client\/(.*)/,
        replacement: path.resolve(__dirname, "Client/$1"),
      },
      {
        // Matches exact imports starting with 'Server/' to resolve to the Server folder
        find: /^Server\/(.*)/,
        replacement: path.resolve(__dirname, "Server/$1"),
      },
      {
        // Keeps standard fallback if you use it in parts of Client
        find: "@",
        replacement: path.resolve(__dirname, "./Client"),
      }
    ],
  },
}));