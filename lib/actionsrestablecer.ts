"use server";

import { revalidatePath } from "next/cache";
import { restablecerDatos } from "./api";

export async function restablecerDatosAction(): Promise<void> {
  await restablecerDatos();
  revalidatePath("/", "layout");
}