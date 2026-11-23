"use server";

import { revalidatePath } from "next/cache";
import { actualizarMeta, decidirSugerencia, registrarAusencia } from "./api";
import type { EstadoSugerencia, NuevaAusencia } from "./tipos";

const ESTADOS: EstadoSugerencia[] = ["pendiente", "aprobada", "rechazada"];

/** Aprobar, rechazar o deshacer una sugerencia. */
export async function decidirAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "");
  if (!ESTADOS.includes(estado as EstadoSugerencia)) return;
  await decidirSugerencia(id, estado as EstadoSugerencia);
  revalidatePath("/", "layout");
}

/** Registrar una ausencia. */
export async function guardarAusenciaAction(datos: NuevaAusencia) {
  const resultado = await registrarAusencia(datos);
  if (resultado.ok) revalidatePath("/", "layout");
  return resultado;
}

/** Cambiar la meta de espera. */
export async function actualizarMetaAction(meta: number) {
  const resultado = await actualizarMeta(meta);
  if (resultado.ok) revalidatePath("/", "layout");
  return resultado;
}