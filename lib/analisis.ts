import { FECHA_HOY, FRANJAS, HORA_INICIO } from "./datos";
import { esperasPorHora, necesariosPorHora } from "./colas";
import type { Estado, Franja, Modalidad, Oficina, Sugerencia } from "./tipos";

/* Cálculos por oficina */

/** Franja → posiciones (0 a 9) de sus horas dentro de los arreglos por hora. */
function horasDeFranja(f: Franja): [number, number] {
  return [f.inicio - HORA_INICIO, f.fin - HORA_INICIO];
}

/** Espera estimada en cada una de las 5 franjas . */
export function esperasPorFranja(o: Oficina, hay: number | number[] = o.hay): number[] {
  const porHora = esperasPorHora(o.llegadas, o.s, hay);
  return FRANJAS.map((f) => {
    const [desde, hasta] = horasDeFranja(f);
    return Math.max(...porHora.slice(desde, hasta));
  });
}

/** La mayor espera del día. */
export function esperaMax(o: Oficina, hay: number | number[] = o.hay): number {
  return Math.max(...esperasPorFranja(o, hay));
}

/** Posición (0 a 4) de la franja con más espera. */
export function franjaMasCargada(o: Oficina): number {
  const esperas = esperasPorFranja(o);
  return Math.max(0, esperas.indexOf(Math.max(...esperas)));
}

/** Personas necesarias en cada franja para cumplir la meta (la peor hora de cada una). */
export function necesariosPorFranja(o: Oficina, meta: number): number[] {
  const porHora = necesariosPorHora(o.llegadas, o.s, meta);
  return FRANJAS.map((f) => {
    const [desde, hasta] = horasDeFranja(f);
    return Math.max(...porHora.slice(desde, hasta));
  });
}

/** Personas necesarias en la hora más cargada. */
export function necesariosMax(o: Oficina, meta: number): number {
  return Math.max(...necesariosPorFranja(o, meta));
}

export function estaFueraDeMeta(o: Oficina, meta: number): boolean {
  return esperaMax(o) > meta;
}

/** De mayor a menor espera. Si empatan, va primero a la que más personas le faltan. */
export function ordenarPorEspera(oficinas: Oficina[], meta: number): Oficina[] {
  return [...oficinas].sort((a, b) => {
    const ea = esperaMax(a);
    const eb = esperaMax(b);
    if (ea !== eb) return ea > eb ? -1 : 1;
    return necesariosMax(b, meta) - b.hay - (necesariosMax(a, meta) - a.hay);
  });
}

export function oficinasFueraDeMeta(oficinas: Oficina[], meta: number): Oficina[] {
  return ordenarPorEspera(oficinas, meta).filter((o) => estaFueraDeMeta(o, meta));
}

/* Personal */

export function presentes(oficinas: Oficina[]): number {
  return oficinas.reduce((total, o) => total + o.hay, 0);
}

export function totalColaboradores(estado: Pick<Estado, "oficinas" | "ausencias">): number {
  return presentes(estado.oficinas) + estado.ausencias.length;
}

/* Textos */

/** "A", "A y B", "A, B y C" */
export function unir(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

export function plural(n: number, uno: string, varios: string): string {
  return n === 1 ? uno : varios;
}

function hora(h: number): string {
  return `${h % 12 === 0 ? 12 : h % 12}:00`;
}

function meridiano(h: number): string {
  return h < 12 ? "a. m." : "p. m.";
}

export function rangoEnTexto(inicio: number, fin: number): string {
  return meridiano(inicio) === meridiano(fin)
    ? `de ${hora(inicio)} a ${hora(fin)} ${meridiano(fin)}`
    : `de ${hora(inicio)} ${meridiano(inicio)} a ${hora(fin)} ${meridiano(fin)}`;
}

export function rangoCorto(inicio: number, fin: number): string {
  return meridiano(inicio) === meridiano(fin)
    ? `${hora(inicio)} – ${hora(fin)} ${meridiano(fin)}`
    : `${hora(inicio)} ${meridiano(inicio)} – ${hora(fin)} ${meridiano(fin)}`;
}

export function rangoFranja(f: Franja): string {
  return rangoCorto(f.inicio, f.fin);
}

export function textoFranjas(indices: number[]): string {
  const ordenados = [...new Set(indices)].sort((a, b) => a - b);
  const grupos: number[][] = [];
  for (const i of ordenados) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo[ultimo.length - 1] === i - 1) ultimo.push(i);
    else grupos.push([i]);
  }
  const textos = grupos.map((g) => {
    const primera = FRANJAS[g[0]!]!;
    const ultima = FRANJAS[g[g.length - 1]!]!;
    return rangoEnTexto(primera.inicio, ultima.fin);
  });
  return unir(textos);
}

export function esperaEnFrase(w: number): string {
  if (!Number.isFinite(w) || w > 60) return "más de 60 min";
  if (w < 1) return "menos de 1 min";
  return `${Math.round(w)} min`;
}

export function resumenPanel(oficinas: Oficina[], meta: number): string {
  const fuera = oficinasFueraDeMeta(oficinas, meta);
  if (fuera.length === 0) {
    return `Hoy ninguna oficina supera la meta: nadie debería esperar más de ${meta} minutos.`;
  }
  const lista = unir(
    fuera.map((o) => `${o.nombre} (${esperaEnFrase(esperaMax(o)).replace(/^(\d)/, "unos $1")})`),
  );
  const franjas = new Set<number>();
  for (const o of fuera) {
    esperasPorFranja(o).forEach((e, i) => {
      if (e > meta) franjas.add(i);
    });
  }
  const n = fuera.length;
  return (
    `Se esperan filas largas en ${n} ${plural(n, "oficina", "oficinas")}: ${lista}, ` +
    `${textoFranjas([...franjas])} La meta es que nadie espere más de ${meta} minutos.`
  );
}

/* Malla */

export function diferenciaPorFranja(o: Oficina, meta: number): number[] {
  return necesariosPorFranja(o, meta).map((n) => o.hay - n);
}

export type GrupoMalla = "ayuda" | "apoyo" | "bien";

export function clasificarMalla(o: Oficina, meta: number): GrupoMalla {
  const dif = diferenciaPorFranja(o, meta);
  if (dif.some((d) => d < 0)) return "ayuda";
  if (dif.every((d) => d > 0)) return "apoyo";
  return "bien";
}

export function agruparMalla(oficinas: Oficina[], meta: number) {
  const ayuda = ordenarPorEspera(oficinas, meta).filter((o) => clasificarMalla(o, meta) === "ayuda");
  const apoyo = oficinas.filter((o) => clasificarMalla(o, meta) === "apoyo");
  const bien = oficinas.filter((o) => clasificarMalla(o, meta) === "bien");
  return { ayuda, apoyo, bien };
}

export function resumenMalla(oficinas: Oficina[], meta: number): string {
  const { ayuda, apoyo } = agruparMalla(oficinas, meta);
  const partes: string[] = [];

  if (ayuda.length === 0) {
    partes.push("Hoy no falta personal en ninguna oficina.");
  } else {
    const faltan = ayuda.reduce(
      (total, o) => total + Math.max(0, -Math.min(...diferenciaPorFranja(o, meta))),
      0,
    );
    const franjas = new Set<number>();
    for (const o of ayuda) {
      diferenciaPorFranja(o, meta).forEach((d, i) => {
        if (d < 0) franjas.add(i);
      });
    }
    partes.push(
      `Hoy ${plural(faltan, "falta", "faltan")} ${faltan} ${plural(faltan, "persona", "personas")} en ` +
        `${ayuda.length} ${plural(ayuda.length, "oficina", "oficinas")}: ${unir(ayuda.map((o) => o.nombre))}, ` +
        `${textoFranjas([...franjas])}`,
    );
  }

  if (apoyo.length > 0) {
    const minimos = apoyo.map((o) => Math.min(...diferenciaPorFranja(o, meta)));
    const igual = minimos.every((m) => m === minimos[0]);
    const nombres = unir(apoyo.map((o) => o.nombre));
    partes.push(
      igual
        ? `Sobra ${minimos[0]} ${plural(minimos[0]!, "persona", "personas")} todo el día en ${nombres}, que pueden dar apoyo.`
        : `Hay personal de sobra todo el día en ${nombres}, que pueden dar apoyo.`,
    );
  }
  return partes.join(" ");
}

/* ¿Qué pasa si…? */

export function buscarOficina(oficinas: Oficina[], id: string): Oficina {
  const o = oficinas.find((x) => x.id === id);
  if (!o) throw new Error(`Oficina desconocida: ${id}`);
  return o;
}

export type Veredicto = "no-recomendado" | "mejora-no-alcanza" | "buena-idea";

/** Cómo queda una oficina antes y después del movimiento. */
export type LadoSimulacion = {
  oficina: Oficina;
  hayAntes: number;
  hayDespues: number;
  esperasAntes: number[];
  esperasDespues: number[];
  maxAntes: number;
  maxDespues: number;
};

export type Simulacion = {
  veredicto: Veredicto;
  destino: LadoSimulacion;
  origen: LadoSimulacion;
  personas: number;
  modalidad: Modalidad;
  origenSinPersonal: boolean;
};

function lado(o: Oficina, cambio: number, franjasIds: string[], soloDesdePrimera: boolean): LadoSimulacion {
  const hayDespues = o.hay + cambio;
  const hayPorHora = o.llegadas.map((_, i) => {
    const enFranja = FRANJAS.some((f) => franjasIds.includes(f.id) && i >= f.inicio - HORA_INICIO && i < f.fin - HORA_INICIO);
    return enFranja ? hayDespues : o.hay;
  });
  const esperasAntes = esperasPorFranja(o);
  const esperasDespues = esperasPorFranja(o, hayPorHora);
  const primera = FRANJAS.findIndex((f) => franjasIds.includes(f.id));
  const desde = soloDesdePrimera && primera > 0 ? primera : 0;
  return {
    oficina: o,
    hayAntes: o.hay,
    hayDespues,
    esperasAntes,
    esperasDespues,
    maxAntes: Math.max(...esperasAntes.slice(desde)),
    maxDespues: Math.max(...esperasDespues.slice(desde)),
  };
}

export function simularMovimiento(
  oficinas: Oficina[],
  meta: number,
  origenId: string,
  destinoId: string,
  personas: number,
  modalidad: Modalidad,
  franjasIds: string[] = FRANJAS.map((f) => f.id),
): Simulacion {
  const destino = lado(buscarOficina(oficinas, destinoId), personas, franjasIds, true);
  const origen = lado(buscarOficina(oficinas, origenId), -personas, franjasIds, false);
  const origenSinPersonal = origen.hayDespues < 1;

  let veredicto: Veredicto;
  if (origenSinPersonal || origen.maxDespues > meta) veredicto = "no-recomendado";
  else if (destino.maxDespues > meta) veredicto = "mejora-no-alcanza";
  else veredicto = "buena-idea";

  return { veredicto, destino, origen, personas, modalidad, origenSinPersonal };
}

/* Sugerencias */

export type DetalleSugerencia = {
  sugerencia: Sugerencia;
  origen: Oficina;
  destino: Oficina;
  esperaDestinoAntes: number;
  esperaDestinoDespues: number;
  esperaOrigenDespues: number;
  origenDentroDeMeta: boolean;
  destinoFueraDeMeta: boolean;
  sobraOrigen: number;
  franjasProblema: number[];
};

export function detalleSugerencia(oficinas: Oficina[], meta: number, s: Sugerencia): DetalleSugerencia {
  const origen = buscarOficina(oficinas, s.origenId);
  const destino = buscarOficina(oficinas, s.destinoId);
  const esperasDestino = esperasPorFranja(destino);
  const esperaOrigenDespues = esperaMax(origen, origen.hay - s.personas);
  return {
    sugerencia: s,
    origen,
    destino,
    esperaDestinoAntes: Math.max(...esperasDestino),
    esperaDestinoDespues: esperaMax(destino, destino.hay + s.personas),
    esperaOrigenDespues,
    origenDentroDeMeta: origen.hay - s.personas >= 1 && esperaOrigenDespues <= meta,
    destinoFueraDeMeta: Math.max(...esperasDestino) > meta,
    sobraOrigen: Math.max(0, origen.hay - necesariosMax(origen, meta)),
    franjasProblema: esperasDestino.flatMap((e, i) => (e > meta ? [i] : [])),
  };
}

export function contarPendientes(sugerencias: Sugerencia[]): number {
  return sugerencias.filter((s) => s.estado === "pendiente").length;
}

/* Fechas */

const MESES = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sep.", "oct.", "nov.", "dic."];

export function etiquetaFechas(desde: string, hasta: string): string {
  const [, m1, d1] = desde.split("-").map(Number);
  const [, m2, d2] = hasta.split("-").map(Number);
  if (!m1 || !d1 || !m2 || !d2) return `${desde} – ${hasta}`;
  if (desde === hasta) {
    return desde === FECHA_HOY ? `Solo hoy, ${d1} ${MESES[m1 - 1]}` : `Solo ${d1} ${MESES[m1 - 1]}`;
  }
  if (m1 === m2) return `${d1} – ${d2} ${MESES[m2 - 1]}`;
  return `${d1} ${MESES[m1 - 1]} – ${d2} ${MESES[m2 - 1]}`;
}