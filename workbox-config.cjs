module.exports = {
  globDirectory: "dist/",
  globPatterns: [
    "**/*.{html,js,css,png,json}"
  ],
  swDest: "dist/sw.js",
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  navigateFallback: "/index.html",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 6,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-webfonts",
        expiration: {
          maxEntries: 12,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
};