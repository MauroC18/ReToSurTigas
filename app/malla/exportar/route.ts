import { FECHA_HOY, FRANJAS } from "@/lib/datos";
import {
  diferenciaConApoyos,
  esperasConApoyos,
  etiquetasApoyo,
  necesariosMax,
  rangoFranja,
} from "@/lib/analisis";
import { obtenerEstado } from "@/lib/api";

export const dynamic = "force-dynamic";

function celda(valor: string | number): string {
  return `"${String(valor).replace(/"/g, '""')}"`;
}

function textoDif(d: number): string {
  return d < 0 ? `Falta ${-d}` : d > 0 ? `Sobra ${d}` : "Justo";
}

function textoEspera(w: number): string {
  return Number.isFinite(w) && w <= 60 ? String(Math.round(w)) : "Más de 60";
}

export async function GET() {
  const { oficinas, meta, sugerencias } = await obtenerEstado();

  const encabezado = [
    "Oficina",
    "Personas hoy",
    "Se necesitan hasta",
    ...FRANJAS.map((f) => `${f.id} ${rangoFranja(f)}`),
    ...FRANJAS.map((f) => `Espera ${f.id} (min)`),
    "Apoyos aprobados",
  ];

  const filas = oficinas.map((o) => {
    const dif = diferenciaConApoyos(o, meta, sugerencias);
    const esperas = esperasConApoyos(o, sugerencias);
    return [
      o.nombre,
      o.hay,
      necesariosMax(o, meta),
      ...dif.map(textoDif),
      ...esperas.map(textoEspera),
      etiquetasApoyo(o, oficinas, sugerencias).join(" | "),
    ];
  });

  const contenido = [encabezado, ...filas].map((f) => f.map(celda).join(";")).join("\r\n");

  // El BOM al inicio hace que Excel muestre bien las tildes.
  return new Response("\uFEFF" + contenido, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="malla-${FECHA_HOY}-meta-${meta}min.csv"`,
    },
  });
}