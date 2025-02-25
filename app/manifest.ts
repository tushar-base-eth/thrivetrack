import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ThriveTrack",
    short_name: "ThriveTrack",
    description: "A simple, intuitive fitness tracking web app",
    start_url: "/",
    display: "standalone",
    background_color: "#1C2526",
    theme_color: "#3B82F6",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
