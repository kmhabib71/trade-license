import type { MetadataRoute } from "next";

// PWA manifest (served at /manifest.webmanifest). Icons are added in Phase 8.1.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ই-ট্রেড লাইসেন্স ট্র্যাকার",
    short_name: "ট্রেড লাইসেন্স",
    description:
      "ট্রেড লাইসেন্স ইস্যু, ট্র্যাকিং, বকেয়া আদায় ও বাল্ক এসএমএস প্ল্যাটফর্ম।",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f766e",
    lang: "bn",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
