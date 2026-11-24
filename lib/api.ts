import { escribirEstado, leerEstado } from "./store";
import { FRANJAS } from "./datos";
import { simularMovimiento } from "./analisis";
import { proponerApoyos } from "./motor";
import { TIPOS_AUSENCIA, type Estado, type EstadoSugerencia, type Modalidad, type NuevaAusencia } from "./tipos";

/**
 * Hoy lee y escribe en el estado en memoria. Cuando exista el servicio de
 * turnos con Postgres, solo se cambia este archivo y las pantallas no se tocan.
 */

/**
 * Recalcula las sugerencias del motor y conserva las decisiones ya tomadas.
 * Las que se enviaron a mano desde el simulador (id "manual-…") se dejan como están.
 */
function recalcularSugerencias(e: Estado): void {
  const decididas = new Map(e.sugerencias.filter((s) => s.estado !== "pendiente").map((s) => [s.id, s.estado]));
  const manuales = e.sugerencias.filter((s) => s.id.startsWith("manual-"));
  const automaticas = proponerApoyos(e.oficinas, e.meta).map((s) => ({ ...s, estado: decididas.get(s.id) ?? ("pendiente" as const) }));
  e.sugerencias = [...automaticas, ...manuales];
}

export async function obtenerEstado(): Promise<Estado> {
  return structuredClone(await leerEstado());
}

export async function decidirSugerencia(id: string, estado: EstadoSugerencia): Promise<void> {
  await escribirEstado((e) => {
    const s = e.sugerencias.find((x) => x.id === id);
    if (s) s.estado = estado;
  });
}

export type ResultadoAusencia = { ok: true } | { ok: false; error: string };

/** Valida, descuenta a la persona de su oficina y guarda la ausencia. */
export async function registrarAusencia(datos: NuevaAusencia): Promise<ResultadoAusencia> {
  const colaborador = datos.colaborador.trim();
  if (!colaborador) return { ok: false, error: "Escribe el nombre del colaborador" };
  if (!TIPOS_AUSENCIA.includes(datos.tipo)) return { ok: false, error: "Elige un motivo válido" };
  if (!datos.desde || !datos.hasta) return { ok: false, error: "Elige las fechas" };
  if (datos.hasta < datos.desde) return { ok: false, error: "La fecha final no puede ser anterior a la inicial" };

  let resultado: ResultadoAusencia = { ok: true };
  await escribirEstado((e) => {
    const oficina = e.oficinas.find((o) => o.id === datos.oficinaId);
    if (!oficina) {
      resultado = { ok: false, error: "Oficina no encontrada" };
      return;
    }
    if (oficina.hay < 1) {
      resultado = { ok: false, error: "Esa oficina no tiene personas disponibles hoy" };
      return;
    }
    oficina.hay -= 1;
    e.ausencias.push({ id: `a${Date.now()}`, ...datos, colaborador });
    recalcularSugerencias(e);
  });
  return resultado;
}

/** Cambia la meta de espera que usan todas las pantallas. */
export async function actualizarMeta(meta: number): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Number.isInteger(meta) || meta < 1 || meta > 60) {
    return { ok: false, error: "Escribe un número entero entre 1 y 60" };
  }
  await escribirEstado((e) => {
    e.meta = meta;
    recalcularSugerencias(e);
  });
  return { ok: true };
}

/** Llegadas por hora (10 valores, de 7 a 16) y minutos por visita de una oficina, ya calculados. */
export type DatosOficina = { id: string; llegadas: number[]; s: number };

export type ResultadoImportacionAplicada = { ok: true; actualizadas: number } | { ok: false; error: string };

/** Aplica los datos calculados de un archivo de Digiturno y recalcula las sugerencias. */
export async function aplicarImportacion(datos: DatosOficina[]): Promise<ResultadoImportacionAplicada> {
  if (!Array.isArray(datos) || datos.length === 0) return { ok: false, error: "No hay datos para aplicar" };
  const validos = datos.every(
    (d) =>
      typeof d.id === "string" &&
      Array.isArray(d.llegadas) &&
      d.llegadas.length === 10 &&
      d.llegadas.every((x) => Number.isFinite(x) && x >= 0 && x <= 10000) &&
      Number.isFinite(d.s) &&
      d.s > 0 &&
      d.s <= 120,
  );
  if (!validos) return { ok: false, error: "Los datos del archivo no son válidos" };

  let resultado: ResultadoImportacionAplicada = { ok: true, actualizadas: 0 };
  await escribirEstado((e) => {
    if (datos.some((d) => !e.oficinas.some((o) => o.id === d.id))) {
      resultado = { ok: false, error: "El archivo trae una oficina que no existe" };
      return;
    }
    for (const d of datos) {
      const o = e.oficinas.find((x) => x.id === d.id)!;
      o.llegadas = [...d.llegadas];
      o.s = d.s;
    }
    recalcularSugerencias(e);
    resultado = { ok: true, actualizadas: datos.length };
  });
  return resultado;
}

export type DatosSugerenciaManual = {
  origenId: string;
  destinoId: string;
  personas: number;
  modalidad: Modalidad;
  franjas: string[];
};

export type ResultadoSugerenciaManual = { ok: true; id: string } | { ok: false; error: string };

/** Crea una sugerencia pendiente a partir de lo que se armó en el simulador. */
export async function crearSugerenciaManual(datos: DatosSugerenciaManual): Promise<ResultadoSugerenciaManual> {
  const { origenId, destinoId, personas, modalidad } = datos;
  const franjas = FRANJAS.filter((f) => datos.franjas?.includes(f.id)).map((f) => f.id);
  if (origenId === destinoId) return { ok: false, error: "Elige dos oficinas distintas" };
  if (!Number.isInteger(personas) || personas < 1 || personas > 2) return { ok: false, error: "Elige 1 o 2 personas" };
  if (modalidad !== "presencial" && modalidad !== "virtual") return { ok: false, error: "Elige cómo atiende" };
  if (franjas.length === 0) return { ok: false, error: "Elige al menos una franja" };

  let resultado: ResultadoSugerenciaManual = { ok: false, error: "No se pudo crear la sugerencia" };
  await escribirEstado((e) => {
    if (!e.oficinas.some((o) => o.id === origenId) || !e.oficinas.some((o) => o.id === destinoId)) {
      resultado = { ok: false, error: "Oficina no encontrada" };
      return;
    }
    const sim = simularMovimiento(e.oficinas, e.meta, origenId, destinoId, personas, modalidad, franjas);
    if (sim.veredicto === "no-recomendado") {
      resultado = { ok: false, error: "Esa opción no se recomienda: deja a la oficina de origen fuera de la meta" };
      return;
    }
    const id = `manual-${origenId}-${destinoId}-${franjas.join("")}-${personas}-${modalidad}`;
    if (!e.sugerencias.some((s) => s.id === id)) {
      e.sugerencias.push({ id, origenId, destinoId, personas, modalidad, franjas, estado: "pendiente" });
    }
    resultado = { ok: true, id };
  });
  return resultado;
}
