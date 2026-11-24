"use server";

import { revalidatePath } from "next/cache";
import { crearSugerenciaManual, type DatosSugerenciaManual, type ResultadoSugerenciaManual } from "./api";

export async function crearSugerenciaAction(datos: DatosSugerenciaManual): Promise<ResultadoSugerenciaManual> {
  const resultado = await crearSugerenciaManual(datos);
  if (resultado.ok) revalidatePath("/", "layout");
  return resultado;
}