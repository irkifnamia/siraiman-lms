import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SIR AIMAN LMS", short_name: "Sir Aiman LMS", start_url: "/", display: "standalone",
    background_color: "#f8fafc", theme_color: "#0f6661",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }, { src: "/apple-icon", sizes: "180x180", type: "image/png" }],
  };
}
