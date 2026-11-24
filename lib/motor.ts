import { FRANJAS } from "./datos";
import { necesariosPorFranja, simularMovimiento } from "./analisis";
import type { Oficina, Sugerencia } from "./tipos";

export function proponerApoyos(oficinas: Oficina[], meta: number): Sugerencia[] {
  const dif = oficinas.map((o) => necesariosPorFranja(o, meta).map((n) => o.hay - n));
  // Cuántas personas puede dar cada oficina en cada franja.
  const sobra = oficinas.map((o, i) => dif[i]!.map((d) => Math.max(0, Math.min(d, o.hay - 1))));

  const pares = new Map<string, { origenId: string; destinoId: string; franjas: string[] }>();

  FRANJAS.forEach((f, fi) => {
    const faltan = oficinas
      .map((o, i) => ({ o, i, falta: -dif[i]![fi]! }))
      .filter((x) => x.falta > 0)
      .sort((a, b) => b.falta - a.falta);

    for (const destino of faltan) {
      let falta = destino.falta;
      while (falta > 0) {
        let mejor = -1;
        oficinas.forEach((_, i) => {
          if (i !== destino.i && sobra[i]![fi]! > 0 && (mejor < 0 || sobra[i]![fi]! > sobra[mejor]![fi]!)) mejor = i;
        });
        if (mejor < 0) break;
        sobra[mejor]![fi]! -= 1;
        falta -= 1;
        const clave = `${oficinas[mejor]!.id}>${destino.o.id}`;
        const par = pares.get(clave) ?? { origenId: oficinas[mejor]!.id, destinoId: destino.o.id, franjas: [] };
        if (!par.franjas.includes(f.id)) par.franjas.push(f.id);
        pares.set(clave, par);
      }
    }
  });

  const resultado: Sugerencia[] = [];
  for (const p of pares.values()) {
    const sim = simularMovimiento(oficinas, meta, p.origenId, p.destinoId, 1, "virtual", p.franjas);
    if (sim.veredicto === "no-recomendado") continue;
    if (sim.destino.maxDespues >= sim.destino.maxAntes) continue;
    resultado.push({
      id: `auto-${p.origenId}-${p.destinoId}`,
      origenId: p.origenId,
      destinoId: p.destinoId,
      personas: 1,
      modalidad: "virtual",
      franjas: p.franjas,
      estado: "pendiente",
    });
  }
  return resultado;
}