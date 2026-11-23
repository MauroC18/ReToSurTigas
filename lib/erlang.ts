/**
 * Espera promedio (en minutos) de un cliente.
 * lam: clientes que llegan por hora
 * s:   minutos por atención
 * c:   personas atendiendo
 */
export function esperaMin(lam: number, s: number, c: number): number {
  if (c < 1) return Infinity;
  const mu = 60 / s; // clientes que atiende una persona por hora
  const a = lam / mu; // carga de trabajo
  if (c <= a) return Infinity; // no alcanzan: la fila crece sin parar

  let suma = 0;
  let termino = 1;
  for (let k = 0; k < c; k++) {
    if (k > 0) termino = (termino * a) / k;
    suma += termino;
  }
  const tope = (termino * a) / (c - a);
  const probEspera = tope / (suma + tope);
  return (probEspera / (c * mu - lam)) * 60;
}

export function necesarios(lam: number, s: number, meta: number): number {
  for (let c = 1; c <= 30; c++) {
    if (esperaMin(lam, s, c) <= meta) return c;
  }
  return 30;
}

export function formatoEspera(w: number): string {
  if (!Number.isFinite(w) || w > 60) return "Más de 60 min";
  if (w < 1) return "Menos de 1 min";
  return `${Math.round(w)} min`;
}