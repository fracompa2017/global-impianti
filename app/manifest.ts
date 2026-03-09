import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Global Impianti",
    short_name: "G. Impianti",
    description: "Gestionale cantieri e team per Global Impianti",
    start_url: "/auth/login",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#3B6FE8",
    orientation: "portrait",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-72.png", sizes: "72x72", type: "image/png" },
      { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { src: "/icons/icon-128.png", sizes: "128x128", type: "image/png" },
      { src: "/icons/icon-144.png", sizes: "144x144", type: "image/png" },
      { src: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Timbra Entrata",
        url: "/dipendente/home?action=timbra",
        icons: [{ src: "/icons/shortcut-timbra.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Nuovo Report",
        url: "/dipendente/report/nuovo",
        icons: [{ src: "/icons/shortcut-report.png", sizes: "96x96", type: "image/png" }],
      },
    ],
  };
}
