import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { contarPendientes } from "@/lib/analisis";
import { obtenerEstado } from "@/lib/api";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

export const metadata: Metadata = {
  title: "Panel de turnos · Surtigas",
  description: "Cuántas personas necesita cada oficina, hora por hora.",
};

// Los datos cambian con las decisiones del coordinador: no se guardan en caché.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const estado = await obtenerEstado();
  return (
    <html lang="es" className={figtree.variable}>
      <body>
        <div className="app">
          <Sidebar pendientes={contarPendientes(estado.sugerencias)} />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}