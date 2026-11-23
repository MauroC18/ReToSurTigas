import type { Ausencia, Estado, Franja, Oficina, Sugerencia } from "./tipos";

export const FECHA_HOY = "2026-10-16";
export const FECHA_LARGA = "Viernes 16 de octubre de 2026";
export const META_INICIAL = 30;
export const HORA_INICIO = 7;

export const FRANJAS: Franja[] = [
  { id: "F1", inicio: 7, fin: 9, pico: true },
  { id: "F2", inicio: 9, fin: 11, pico: true },
  { id: "F3", inicio: 11, fin: 13, pico: false },
  { id: "F4", inicio: 13, fin: 15, pico: true },
  { id: "F5", inicio: 15, fin: 17, pico: false },
];

export const FACTOR_HORA = [0.8, 0.97, 0.98, 1, 0.97, 0.73, 0.78, 0.83, 0.92, 0.73];

export const EFICIENCIA = 0.85;

export const OFICINAS_BASE: Oficina[] = [
  { id: "cartagena", nombre: "Cartagena", s: 14.4, llegadas: [40.3, 34.4, 33.6, 28.7, 22.9, 16.4, 16.5, 18.9, 10.0, 0.8], hay: 7 },
  { id: "monteria", nombre: "Montería", s: 11.8, llegadas: [18.7, 23.3, 21.4, 17.7, 13.7, 9.5, 12.7, 14.9, 11.3, 0.3], hay: 4 },
  { id: "sincelejo", nombre: "Sincelejo", s: 12.9, llegadas: [14.2, 16.7, 17.4, 14.7, 10.6, 7.1, 7.8, 11.5, 9.2, 0.6], hay: 4 },
  { id: "cerete", nombre: "Cereté", s: 8.7, llegadas: [6.6, 14.4, 12.8, 11.8, 6.9, 2.2, 3.3, 7.9, 6.7, 0.1], hay: 2 },
  { id: "turbaco", nombre: "Turbaco", s: 10.4, llegadas: [4.5, 12.0, 13.8, 12.2, 8.8, 3.5, 5.9, 9.1, 8.3, 0.2], hay: 2 },
  { id: "magangue", nombre: "Magangué", s: 8.5, llegadas: [6.0, 12.4, 11.9, 12.4, 4.6, 0.3, 9.2, 10.6, 6.8, 0.2], hay: 2 },
  { id: "corozal", nombre: "Corozal", s: 6.3, llegadas: [5.5, 12.9, 13.4, 11.6, 4.5, 1.5, 1.3, 5.8, 5.6, 0.0], hay: 2 },
  { id: "sahagun", nombre: "Sahagún", s: 8.4, llegadas: [4.3, 9.8, 10.1, 9.9, 4.9, 0.8, 1.2, 7.5, 6.2, 0.1], hay: 2 },
  { id: "carmen-de-bolivar", nombre: "Carmen de Bolívar", s: 5.8, llegadas: [3.5, 11.2, 11.1, 9.9, 4.3, 0.3, 2.1, 7.4, 4.9, 0.1], hay: 1 },
  { id: "lorica", nombre: "Lorica", s: 6.4, llegadas: [2.9, 8.0, 10.6, 9.2, 3.7, 0.3, 2.9, 5.0, 4.9, 0.1], hay: 1 },
  { id: "mompox", nombre: "Mompox", s: 6.6, llegadas: [2.6, 8.7, 9.5, 8.8, 4.3, 0.1, 1.2, 6.6, 5.7, 0.1], hay: 1 },
  { id: "caucasia", nombre: "Caucasia", s: 8.5, llegadas: [1.8, 5.6, 6.7, 6.0, 2.8, 0.1, 1.0, 5.7, 4.2, 0.2], hay: 1 },
  { id: "tolu", nombre: "Tolú", s: 8.1, llegadas: [2.7, 8.3, 8.9, 7.4, 3.4, 0.4, 2.1, 4.7, 4.8, 0.2], hay: 1 },
  { id: "planeta-rica", nombre: "Planeta Rica", s: 7.9, llegadas: [1.6, 3.5, 4.1, 3.8, 1.6, 0.0, 0.7, 3.1, 2.6, 0.1], hay: 1 },
];

export const AUSENCIAS_BASE: Ausencia[] = [
  { id: "a1", colaborador: "Colaborador 08", oficinaId: "cartagena", tipo: "Incapacidad", desde: "2026-10-16", hasta: "2026-10-18" },
  { id: "a2", colaborador: "Colaborador 21", oficinaId: "monteria", tipo: "Permiso", desde: "2026-10-16", hasta: "2026-10-16" },
  { id: "a3", colaborador: "Colaborador 27", oficinaId: "sincelejo", tipo: "Incapacidad", desde: "2026-10-16", hasta: "2026-10-17" },
];

export const SUGERENCIAS_BASE: Sugerencia[] = [];

export const OFICINAS_RESUMEN_DATOS = ["cartagena", "monteria", "sincelejo", "turbaco", "magangue", "cerete"] as const;

export function estadoInicial(): Estado {
  return {
    meta: META_INICIAL,
    oficinas: OFICINAS_BASE.map((o) => ({ ...o, llegadas: [...o.llegadas] })),
    ausencias: AUSENCIAS_BASE.map((a) => ({ ...a })),
    sugerencias: SUGERENCIAS_BASE.map((s) => ({ ...s })),
  };
}