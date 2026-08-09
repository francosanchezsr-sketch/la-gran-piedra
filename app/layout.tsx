import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Work_Sans } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FBFBFA",
};

// El dominio de producción no se escribe a mano: sale de NEXT_PUBLIC_SITE_URL o,
// en Vercel, de la variable que el propio Vercel inyecta. Sin base, Next avisa y
// las imágenes de las tarjetas para compartir salen con rutas relativas, que
// ningún WhatsApp ni Facebook sabe resolver.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const titulo = "La Gran Piedra | Casas Custom · Rio Grande Valley";
const descripcion =
  "Casas custom en el Rio Grande Valley. Aquí el cliente firma el plano: personaliza lote, floorplan, fachada, interiores y módulos antes de construir.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: titulo,
  description: descripcion,
  alternates: { canonical: "/" },
  // Casi todo el tráfico de una constructora llega por un enlace pegado en
  // WhatsApp o Messenger. Sin esto, ese enlace se ve como una URL pelona.
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "/",
    siteName: "La Gran Piedra",
    title: titulo,
    description: descripcion,
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Casa terminada de La Gran Piedra en el Rio Grande Valley",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: titulo,
    description: descripcion,
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${archivo.variable} ${ibmPlexMono.variable} ${workSans.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
