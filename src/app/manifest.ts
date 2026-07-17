import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VibeFitAI — Entrena con inteligencia",
    short_name: "VibeFitAI",
    description: "Registra tus entrenamientos con voz, fotos y texto. IA que entiende tu progreso.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7f9fb",
    theme_color: "#131b2e",
    orientation: "portrait",
    categories: ["fitness", "health", "sports"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Registrar entrenamiento",
        url: "/record",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
