import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir el dev server desde otros dispositivos de la red local
  // (móvil, tablet). Sin esto Next.js devuelve 403 en /_next/* y en el
  // websocket de HMR para cualquier origen distinto de localhost.
  allowedDevOrigins: ["192.168.1.*", "*.trycloudflare.com"],
};

export default nextConfig;
