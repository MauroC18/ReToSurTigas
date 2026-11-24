import { HORA_INICIO } from "./datos";
import type { Oficina } from "./tipos";

/**
 * Importa un CSV de Digiturno con una fila por turno atendido.
 *
 * Columnas obligatorias (en cualquier orden, separadas por coma o punto y coma):
 *   oficina           nombre o id de la oficina (ej. "Cartagena", "carmen-de-bolivar")
 *   fecha             aaaa-mm-dd
 *   hora              hora de llegada: 7, 07:30 o 07:30:15
 *   minutos_atencion  minutos que duró la atención
 *
 * De cada oficina calcula las llegadas promedio por hora (de 7 a 16) y los minutos por visita.
 * No cambia el personal: eso no sale de este archivo.
 */

export type ResultadoImportacion =
  | {
      ok: true;
      oficinas: { id: string; llegadas: number[]; s: number }[];
      dias: number;
      filasLeidas: number;
      filasDescartadas: number;
      sinDatos: string[];
    }
  | { ok: false; error: string };

const HORAS = 10;
const COLUMNAS = ["oficina", "fecha", "hora", "minutos_atencion"] as const;

function normalizar(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function partir(linea: string, sep: string): string[] {
  const celdas: string[] = [];
  let actual = "";
  let entreComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i]!;
    if (c === '"') {
      if (entreComillas && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else entreComillas = !entreComillas;
    } else if (c === sep && !entreComillas) {
      celdas.push(actual.trim());
      actual = "";
    } else actual += c;
  }
  celdas.push(actual.trim());
  return celdas;
}

export function importarDigiturno(texto: string, oficinas: Oficina[]): ResultadoImportacion {
  const lineas = texto.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lineas.length < 2) return { ok: false, error: "El archivo está vacío o solo tiene el encabezado" };

  const sep = (lineas[0]!.match(/;/g)?.length ?? 0) > (lineas[0]!.match(/,/g)?.length ?? 0) ? ";" : ",";
  const encabezado = partir(lineas[0]!, sep).map(normalizar);
  const pos = COLUMNAS.map((c) => encabezado.indexOf(c.replace("_", "-")));
  const faltan = COLUMNAS.filter((_, i) => pos[i] === -1);
  if (faltan.length > 0) return { ok: false, error: `Faltan las columnas: ${faltan.join(", ")}` };
  const [pOficina, pFecha, pHora, pMin] = pos as [number, number, number, number];

  const porId = new Map<string, Oficina>();
  for (const o of oficinas) {
    porId.set(o.id, o);
    porId.set(normalizar(o.nombre), o);
  }

  const dias = new Set<string>();
  const llegadas = new Map<string, number[]>();
  const minutos = new Map<string, { suma: number; n: number }>();
  let leidas = 0;
  let descartadas = 0;

  for (const linea of lineas.slice(1)) {
    const c = partir(linea, sep);
    const oficina = porId.get(normalizar(c[pOficina] ?? ""));
    const fecha = (c[pFecha] ?? "").slice(0, 10);
    const hora = Number((c[pHora] ?? "").split(":")[0]);
    const min = Number((c[pMin] ?? "").replace(",", "."));
    if (!oficina || !/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !Number.isInteger(hora) || !Number.isFinite(min)) {
      descartadas++;
      continue;
    }
    leidas++;
    dias.add(fecha);
    const i = hora - HORA_INICIO;
    if (i >= 0 && i < HORAS) {
      const arr = llegadas.get(oficina.id) ?? new Array<number>(HORAS).fill(0);
      arr[i]! += 1;
      llegadas.set(oficina.id, arr);
    }
    if (min > 0 && min <= 120) {
      const m = minutos.get(oficina.id) ?? { suma: 0, n: 0 };
      m.suma += min;
      m.n += 1;
      minutos.set(oficina.id, m);
    }
  }

  if (leidas === 0) return { ok: false, error: "No se pudo leer ninguna fila. Revisa los nombres de oficina, las fechas y las horas" };

  const nDias = dias.size;
  const resultado: { id: string; llegadas: number[]; s: number }[] = [];
  const sinDatos: string[] = [];
  for (const o of oficinas) {
    const arr = llegadas.get(o.id);
    const m = minutos.get(o.id);
    if (!arr || !m || m.n === 0) {
      sinDatos.push(o.nombre);
      continue;
    }
    resultado.push({
      id: o.id,
      llegadas: arr.map((x) => Math.round((x / nDias) * 10) / 10),
      s: Math.round((m.suma / m.n) * 10) / 10,
    });
  }
  if (resultado.length === 0) return { ok: false, error: "Ninguna oficina del archivo tiene llegadas y minutos de atención" };

  return { ok: true, oficinas: resultado, dias: nDias, filasLeidas: leidas, filasDescartadas: descartadas, sinDatos };
}