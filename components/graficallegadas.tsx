"use client";

import { useState } from "react";
import type { SerieOficina } from "@/lib/analisis";

const HORA_INICIO = 7;
const ANCHO = 640;
const ALTO = 260;
const MARGEN = { izq: 40, der: 12, arr: 12, abajo: 32 };

function hora(i: number): string {
  const h = HORA_INICIO + i;
  return `${h > 12 ? h - 12 : h}${h >= 12 ? " p. m." : " a. m."}`;
}

/** Llegadas por hora contra lo que se puede atender, para una oficina a elegir. */
export function GraficaLlegadas({ series, meta }: { series: SerieOficina[]; meta: number }) {
  const [id, setId] = useState(series[0]?.id ?? "");
  const serie = series.find((s) => s.id === id) ?? series[0];
  if (!serie) return null;

  const maximo = Math.max(1, ...serie.llegadas, ...serie.capacidad);
  const tope = Math.ceil(maximo * 1.15);
  const pasos = 4;
  const areaAncho = ANCHO - MARGEN.izq - MARGEN.der;
  const areaAlto = ALTO - MARGEN.arr - MARGEN.abajo;
  const ancho = areaAncho / serie.llegadas.length;
  const y = (v: number) => MARGEN.arr + areaAlto - (v / tope) * areaAlto;
  const x = (i: number) => MARGEN.izq + ancho * i + ancho / 2;

  const lineaCapacidad = serie.capacidad.map((c, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(c).toFixed(1)}`).join(" ");
  const peor = serie.esperas.reduce((m, w, i) => (w > serie.esperas[m]! ? i : m), 0);
  const peorTexto = serie.esperas[peor]! >= 999 ? "no hay nadie atendiendo" : `≈ ${Math.round(serie.esperas[peor]!)} min`;
  const fueraDeMeta = serie.esperas[peor]! > meta;

  return (
    <div>
      <div className="campo">
        <label htmlFor="oficina-grafica">Oficina</label>
        <select id="oficina-grafica" value={serie.id} onChange={(e) => setId(e.target.value)}>
          {series.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      </div>

      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        role="img"
        aria-label={`Clientes que llegan por hora en ${serie.nombre} contra los que se pueden atender`}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {Array.from({ length: pasos + 1 }, (_, k) => {
          const v = (tope / pasos) * k;
          return (
            <g key={k}>
              <line x1={MARGEN.izq} x2={ANCHO - MARGEN.der} y1={y(v)} y2={y(v)} stroke="#d9d4ca" strokeWidth={1} />
              <text x={MARGEN.izq - 6} y={y(v) + 4} textAnchor="end" fontSize={11} fill="#5b6770">
                {Math.round(v)}
              </text>
            </g>
          );
        })}

        {serie.llegadas.map((l, i) => {
          const sobra = l > serie.capacidad[i]!;
          return (
            <g key={i}>
              <rect
                x={x(i) - ancho * 0.32}
                y={y(l)}
                width={ancho * 0.64}
                height={Math.max(0, MARGEN.arr + areaAlto - y(l))}
                fill={sobra ? "#d9826b" : "#8bb8c6"}
              >
                <title>{`${hora(i)}: llegan ${l.toFixed(1)}, se atienden ${serie.capacidad[i]!.toFixed(1)}`}</title>
              </rect>
              <text x={x(i)} y={ALTO - 12} textAnchor="middle" fontSize={11} fill="#5b6770">
                {HORA_INICIO + i}
              </text>
            </g>
          );
        })}

        <path d={lineaCapacidad} fill="none" stroke="#17414f" strokeWidth={2.5} />
        {serie.capacidad.map((c, i) => (
          <circle key={i} cx={x(i)} cy={y(c)} r={3} fill="#17414f" />
        ))}
      </svg>

      <ul className="chico" style={{ display: "flex", gap: 16, flexWrap: "wrap", listStyle: "none", padding: 0, margin: "8px 0" }}>
        <li>
          <span aria-hidden style={{ display: "inline-block", width: 12, height: 12, background: "#8bb8c6", marginRight: 6 }} />
          Llegan menos de los que se pueden atender
        </li>
        <li>
          <span aria-hidden style={{ display: "inline-block", width: 12, height: 12, background: "#d9826b", marginRight: 6 }} />
          Llegan más de los que se pueden atender
        </li>
        <li>
          <span aria-hidden style={{ display: "inline-block", width: 18, height: 3, background: "#17414f", marginRight: 6, verticalAlign: "middle" }} />
          Clientes que se pueden atender por hora
        </li>
      </ul>

      <p className="chico">
        Horas del día (de 7 a. m. a 4 p. m.) contra clientes por hora. Hora con más espera: {hora(peor)}, {peorTexto}
        {fueraDeMeta ? `, por encima de la meta de ${meta} min.` : ", dentro de la meta."}
      </p>
    </div>
  );
}