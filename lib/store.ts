import { estadoInicial } from "./datos";
import type { Estado } from "./tipos";

const g = globalThis as unknown as { __estado?: Estado };

export function leerEstado(): Estado {
  g.__estado ??= estadoInicial();
  return g.__estado;
}

export function escribirEstado(cambio: (e: Estado) => void): void {
  cambio(leerEstado());
}