import { EFICIENCIA, FACTOR_HORA } from "./datos";

export function esperasPorHora(llegadas: number[], s: number, hay: number | number[]): number[] {
  const hayEn = (i: number) => (Array.isArray(hay) ? (hay[i] ?? 0) : hay);
  const porPersona = 60 / s; // clientes que atiende una persona en una hora
  let fila = 0; // clientes en espera al empezar la hora
  return llegadas.map((lleg, i) => {
    const capacidad = porPersona * hayEn(i) * (FACTOR_HORA[i] ?? 1) * EFICIENCIA;
    if (capacidad <= 0) {
      fila = fila + lleg;
      return Infinity;
    }
    const filaFinal = Math.max(0, fila + lleg - capacidad);
    const espera = (((fila + filaFinal) / 2) / capacidad) * 60;
    fila = filaFinal;
    return espera;
  });
}

export function necesariosPorHora(llegadas: number[], s: number, meta: number): number[] {
  const porPersona = 60 / s;
  let fila = 0;
  return llegadas.map((lleg) => {
    let personas = 1;
    while (personas < 30) {
      const capacidad = porPersona * personas * EFICIENCIA;
      const filaFinal = Math.max(0, fila + lleg - capacidad);
      if (((fila + filaFinal) / 2 / capacidad) * 60 <= meta) break;
      personas++;
    }
    fila = Math.max(0, fila + lleg - porPersona * personas * EFICIENCIA);
    return personas;
  });
}
