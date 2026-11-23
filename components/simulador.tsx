"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FRANJAS } from "@/lib/datos";
import { esperaEnFrase, rangoFranja, simularMovimiento, type LadoSimulacion } from "@/lib/analisis";
import { formatoEspera } from "@/lib/erlang";
import type { Modalidad, Oficina } from "@/lib/tipos";
import { Pildora } from "./ui";

const DESTINOS = ["cartagena", "monteria", "turbaco", "tolu", "carmen-de-bolivar", "mompox", "lorica"];
const ORIGENES = ["sincelejo", "cerete", "corozal", "sahagun", "magangue", "cartagena"];

/** Fila de botones */
function Chips<T extends string>({
  valor,
  opciones,
  onChange,
  etiqueta,
  nombre,
}: {
  valor: T;
  opciones: readonly T[];
  onChange: (v: T) => void;
  etiqueta: (v: T) => string;
  nombre: string;
}) {
  return (
    <div className="chips" role="radiogroup" aria-label={nombre}>
      {opciones.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={valor === o}
          className="chip"
          onClick={() => onChange(o)}
        >
          {etiqueta(o)}
        </button>
      ))}
    </div>
  );
}

/** Tabla con la espera antes y después, de una oficina. */
function TablaLado({ lado, rol, meta }: { lado: LadoSimulacion; rol: "recibe" | "entrega"; meta: number }) {
  const n = Math.abs(lado.hayDespues - lado.hayAntes);
  return (
    <section className="card tabla-lado">
      <h2>
        {lado.oficina.nombre} ({rol} {n} {n === 1 ? "persona" : "personas"})
      </h2>
      <p className="sub">
        {lado.hayAntes} → {lado.hayDespues} {lado.hayDespues === 1 ? "persona" : "personas"} en las franjas elegidas
      </p>
      <div className="tabla-scroll" style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>Franja</th>
              <th>Espera antes</th>
              <th>Espera después</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {FRANJAS.map((f, i) => {
              const antes = lado.esperasAntes[i]!;
              const despues = lado.esperasDespues[i]!;
              const mal = despues > meta;
              return (
                <tr key={f.id}>
                  <td>
                    <strong>{f.id}</strong> · {rangoFranja(f)}
                  </td>
                  <td className={antes > meta ? "mal-texto" : undefined}>{formatoEspera(antes)}</td>
                  <td className={mal ? "mal-texto" : undefined}>{formatoEspera(despues)}</td>
                  <td>
                    <Pildora tono={mal ? "mal" : "bien"}>{mal ? "Fuera de la meta" : "Dentro de la meta"}</Pildora>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function Simulador({ oficinas, meta }: { oficinas: Oficina[]; meta: number }) {
  const [destino, setDestino] = useState("monteria");
  const [origen, setOrigen] = useState("sincelejo");
  const [personas, setPersonas] = useState(1);
  const [modalidad, setModalidad] = useState<Modalidad>("presencial");

  const [franjas, setFranjas] = useState<string[]>(["F4"]);

  // Marca o desmarca una franja; siempre queda al menos una.
  const alternarFranja = (id: string) =>
    setFranjas((actual) =>
      actual.includes(id) ? (actual.length > 1 ? actual.filter((x) => x !== id) : actual) : [...actual, id],
    );

  const nombre = (id: string) => oficinas.find((o) => o.id === id)?.nombre ?? id;

  // Se recalcula solo cuando cambia alguna elección.
  const sim = useMemo(
    () => simularMovimiento(oficinas, meta, origen, destino, personas, modalidad, franjas),
    [oficinas, meta, origen, destino, personas, modalidad, franjas],
  );

  const dNombre = sim.destino.oficina.nombre;
  const oNombre = sim.origen.oficina.nombre;

  return (
    <div className="dos-col">
      <section className="card" aria-labelledby="arma">
        <h2 id="arma">Arma el movimiento</h2>

        <div className="paso">
          <h3>1. ¿Hacia qué oficina?</h3>
          <Chips nombre="Oficina destino" valor={destino} opciones={DESTINOS} onChange={setDestino} etiqueta={nombre} />
        </div>
        <div className="paso">
          <h3>2. ¿Desde qué oficina?</h3>
          <Chips nombre="Oficina origen" valor={origen} opciones={ORIGENES} onChange={setOrigen} etiqueta={nombre} />
        </div>
        <div className="paso">
          <h3>3. ¿Cuántas personas?</h3>
          <div className="selector">
            <button
              type="button"
              aria-label="Una persona menos"
              disabled={personas <= 1}
              onClick={() => setPersonas((p) => Math.max(1, p - 1))}
            >
              −
            </button>
            <output aria-live="polite">{personas}</output>
            <button
              type="button"
              aria-label="Una persona más"
              disabled={personas >= 2}
              onClick={() => setPersonas((p) => Math.min(2, p + 1))}
            >
              +
            </button>
          </div>
        </div>

        <div className="paso">
          <h3>4. ¿En qué franjas?</h3>
          <div className="chips" role="group" aria-label="Franjas de apoyo">
            {FRANJAS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={franjas.includes(f.id)}
                className="chip"
                onClick={() => alternarFranja(f.id)}
              >
                {f.id} · {rangoFranja(f)}
              </button>
            ))}
          </div>
        </div>

        <div className="paso">
          <h3>5. ¿Cómo atiende?</h3>
          <Chips
            nombre="Modalidad"
            valor={modalidad}
            opciones={["presencial", "virtual"] as const}
            onChange={setModalidad}
            etiqueta={(m) => (m === "presencial" ? "Presencial" : "Virtual")}
          />
          <p className="chico" style={{ marginTop: 10 }}>
            {modalidad === "presencial"
              ? "Tiempo de traslado: [por definir con Surtigas]. Este cálculo no lo incluye todavía."
              : "La persona atiende los turnos de forma virtual desde su oficina, sin viajar."}
          </p>
        </div>
      </section>

      <div className="col-pila" aria-live="polite">
        {sim.veredicto === "no-recomendado" && (
          <div className="veredicto no">
            <h2>No recomendado</h2>
            <p>
              {sim.origenSinPersonal
                ? `${oNombre} quedaría sin personal.`
                : `${oNombre} quedaría con una espera de ${esperaEnFrase(sim.origen.maxDespues)}, por encima de la meta de ${meta} min.`}{" "}
              Conviene elegir otra oficina.
            </p>
          </div>
        )}
        {sim.veredicto === "mejora-no-alcanza" && (
          <div className="veredicto medio">
            <h2>Mejora, pero no alcanza</h2>
            <p>
              La espera en {dNombre} baja de {esperaEnFrase(sim.destino.maxAntes)} a {esperaEnFrase(sim.destino.maxDespues)},
              pero sigue por encima de la meta de {meta} min. Prueba con más personas o con otra oficina.
            </p>
          </div>
        )}
        {sim.veredicto === "buena-idea" && (
          <div className="veredicto si">
            <h2>Buena idea</h2>
            <p>
              La espera máxima en {dNombre} baja de {esperaEnFrase(sim.destino.maxAntes)} a{" "}
              {esperaEnFrase(sim.destino.maxDespues)}. {oNombre} se mantiene en {esperaEnFrase(sim.origen.maxDespues)}, dentro
              de la meta{modalidad === "virtual" ? " (atiende de forma virtual)." : "."}
            </p>
          </div>
        )}

        <TablaLado lado={sim.destino} rol="recibe" meta={meta} />
        <TablaLado lado={sim.origen} rol="entrega" meta={meta} />

        <div>
          <Link href="/alertas" className="btn btn-primario">
            Enviar a aprobación
          </Link>
          <p className="chico" style={{ marginTop: 10 }}>
            Cálculo de ejemplo con los datos de Digiturno de los últimos viernes.
          </p>
        </div>
      </div>
    </div>
  );
}