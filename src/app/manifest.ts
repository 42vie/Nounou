import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AssMatPaie",
    short_name: "AssMatPaie",
    description: "Gestion des bulletins de paie pour assistantes maternelles agréées",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF0E6",
    theme_color: "#C97B4A",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
