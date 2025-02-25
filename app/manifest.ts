import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FitLite",
    short_name: "FitLite",
    description: "Track your workouts and progress",
    start_url: "/",
    display: "standalone",
    background_color: "#1E1E1E",
    theme_color: "#1E1E1E",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  }
}

