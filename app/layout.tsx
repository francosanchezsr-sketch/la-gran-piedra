import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { ProveedorIdioma } from '@/components/ProveedorIdioma';
import { GA_MEASUREMENT_ID } from '@/lib/data';
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

// En inglés, porque es el idioma con el que sale el sitio. Esto es lo que ve
// Google y lo que se pinta en la tarjeta cuando alguien pega el enlace en un
// chat: es una sola versión y tiene que ser la de salida. Para el visitante
// que elige español, `ProveedorIdioma` cambia el título de la pestaña en
// caliente — la tarjeta al compartir no, porque la arma el servidor.
const titulo = "La Gran Piedra | Custom Homes · Rio Grande Valley";
const descripcion =
  "Custom homes in the Rio Grande Valley. Here the client signs off on the plan: choose lot, floorplan, facade, interiors and modules before we build.";

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
    // El sitio sale en inglés y el selector lo cambia en caliente (ver
    // `lib/idioma.ts`). Este atributo tiene que coincidir con el idioma del
    // PRIMER render, o React marca una discrepancia de hidratación.
    <html
      lang="en"
      className={`${archivo.variable} ${ibmPlexMono.variable} ${workSans.variable}`}
    >
      <body>
        {/* Solo en el deploy de producción de Vercel. `NODE_ENV` no sirve
            aquí: Next.js lo marca "production" en CUALQUIER build
            optimizado, incluidos los previews de cada PR — con eso el
            snippet mandaría tráfico de pruebas al GA4 real. `VERCEL_ENV`
            sí distingue producción de preview. */}
        {process.env.VERCEL_ENV === 'production' && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
        {/* El idioma envuelve TODA la página: el selector está en la cabecera
            pero el texto a traducir vive en veinte componentes. Ver
            `components/ProveedorIdioma.tsx`. */}
        <ProveedorIdioma>{children}</ProveedorIdioma>
      </body>
    </html>
  );
}
