import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StackScribe",
    short_name: "StackScribe",
    description: "Technical stories and interview preparation guides.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1a8917",
    icons: [],
  };
}
