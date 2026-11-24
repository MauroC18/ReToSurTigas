"use server";

import { revalidatePath } from "next/cache";
import { aplicarImportacion, type DatosOficina, type ResultadoImportacionAplicada } from "./api";

export async function aplicarImportacionAction(datos: DatosOficina[]): Promise<ResultadoImportacionAplicada> {
  const resultado = await aplicarImportacion(datos);
  if (resultado.ok) revalidatePath("/", "layout");
  return resultado;
}