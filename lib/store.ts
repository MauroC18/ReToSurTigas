import { estadoInicial } from "./datos";
import { proponerApoyos } from "./motor";
import type { Estado } from "./tipos";

const g = globalThis as unknown as { __estado?: Estado };

function crearEstado(): Estado {
  const e = estadoInicial();
  e.sugerencias = proponerApoyos(e.oficinas, e.meta);
  return e;
}

export function leerEstado(): Estado {
  g.__estado ??= crearEstado();
  return g.__estado;
}

export function escribirEstado(cambio: (e: Estado) => void): void {
  cambio(leerEstado());
}