import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "La Gran Piedra | Casas Custom · Rio Grande Valley",
  description:
    "Casas custom en el Rio Grande Valley. Aquí el cliente firma el plano: personaliza lote, floorplan, fachada, interiores y módulos antes de construir.",
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
