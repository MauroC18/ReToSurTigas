import Link from "next/link";
import { FECHA_LARGA, FRANJAS } from "@/lib/datos";
import {
  contarPendientes,
  detalleSugerencia,
  esperaEnFrase,
  esperaMax,
  estaFueraDeMeta,
  franjaMasCargada,
  necesariosMax,
  oficinasFueraDeMeta,
  ordenarPorEspera,
  plural,
  presentes,
  rangoEnTexto,
  resumenPanel,
  totalColaboradores,
} from "@/lib/analisis";
import { formatoEspera } from "@/lib/erlang";
import { obtenerEstado } from "@/lib/api";
import { Encabezado, Pildora } from "@/components/ui";

export default async function PanelDelDia() {
  const estado = await obtenerEstado();
  const { oficinas, meta, ausencias, sugerencias } = estado;

  const ordenadas = ordenarPorEspera(oficinas, meta);
  const fuera = oficinasFueraDeMeta(oficinas, meta);
  const peor = ordenadas[0]!;
  const franjaPeor = FRANJAS[franjaMasCargada(peor)]!;

  return (
    <>
      <Encabezado
        titulo="Panel del día"
        sub={`${FECHA_LARGA} · Datos de Digiturno cargados hoy, 7:00 a. m.`}
        accion={
          <Link href="/alertas" className="btn btn-primario">
            Revisar sugerencias
          </Link>
        }
      />

      <section className="resumen" aria-labelledby="resumen-titulo">
        <h2 id="resumen-titulo">Lo más importante hoy</h2>
        <p>{resumenPanel(oficinas, meta)}</p>
      </section>

      <section className="tarjetas-cifras" aria-label="Cifras del día">
        <div className="card cifra">
          <div className="etiqueta">Colaboradores presentes</div>
          <div className="valor">
            {presentes(oficinas)} de {totalColaboradores(estado)}
          </div>
          <div className="nota">
            {ausencias.length} {plural(ausencias.length, "ausente", "ausentes")} hoy
          </div>
        </div>
        <div className="card cifra">
          <div className="etiqueta">Espera más larga estimada</div>
          <div className={`valor ${esperaMax(peor) > meta ? "mal" : ""}`}>{formatoEspera(esperaMax(peor))}</div>
          <div className="nota">
            {peor.nombre}, {rangoEnTexto(franjaPeor.inicio, franjaPeor.fin).replace(/^de /, "")}
          </div>
        </div>
        <div className="card cifra">
          <div className="etiqueta">Oficinas fuera de la meta</div>
          <div className="valor">
            {fuera.length} de {oficinas.length}
          </div>
          <div className="nota">meta: máximo {meta} min de espera</div>
        </div>
        <div className="card cifra">
          <div className="etiqueta">Sugerencias pendientes</div>
          <div className="valor">{contarPendientes(sugerencias)}</div>
          <div className="nota">esperan una decisión</div>
        </div>
      </section>

      <div className="panel-grid">
        {/* Izquierda: tabla de oficinas */}
        <section className="card" aria-labelledby="tabla-titulo">
          <h2 id="tabla-titulo">Estado por oficina en la hora más cargada</h2>
          <p className="sub">Ordenadas de mayor a menor espera estimada. La meta es esperar máximo {meta} min.</p>
          <div className="tabla-scroll" style={{ marginTop: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>Oficina</th>
                  <th>Hay hoy</th>
                  <th>Se necesitan</th>
                  <th>Espera estimada</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ordenadas.map((o) => {
                  const mal = estaFueraDeMeta(o, meta);
                  return (
                    <tr key={o.id}>
                      <td className="nombre">{o.nombre}</td>
                      <td>{o.hay}</td>
                      <td>{necesariosMax(o, meta)}</td>
                      <td className={mal ? "mal-texto" : undefined}>{formatoEspera(esperaMax(o))}</td>
                      <td>
                        <Pildora tono={mal ? "mal" : "bien"}>{mal ? "Fuera de la meta" : "Dentro de la meta"}</Pildora>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="pie-tabla">
            Espera estimada: cuánto esperaría en promedio un cliente en la hora más cargada, con el personal que hay hoy.
          </p>
        </section>

        {/* Derecha: sugerencias */}
        <section className="card" aria-labelledby="sug-titulo">
          <h2 id="sug-titulo">Sugerencias para hoy</h2>
          <div style={{ marginTop: 8 }}>
            {sugerencias.map((s) => {
              const d = detalleSugerencia(oficinas, meta, s);
              return (
                <article key={s.id} className="sug-item">
                  <div className="sug-titulo">
                    <span>
                      {d.origen.nombre} → {d.destino.nombre}
                    </span>
                    <Pildora tono="neutro">{s.modalidad === "virtual" ? "Virtual" : "Presencial"}</Pildora>
                  </div>
                  {s.estado === "pendiente" ? (
                    <>
                      <p className="sug-texto">
                        {d.sobraOrigen > 0
                          ? `Hoy sobra ${d.sobraOrigen} ${plural(d.sobraOrigen, "persona", "personas")} en ${d.origen.nombre}. `
                          : `Hoy no sobra personal en ${d.origen.nombre}. `}
                        En {d.destino.nombre} la espera en hora pico pasaría de {formatoEspera(d.esperaDestinoAntes)} a{" "}
                        {formatoEspera(d.esperaDestinoDespues)}.
                      </p>
                      <p className={d.origenDentroDeMeta ? "verde" : "rojo"}>
                        {d.origen.nombre} quedaría en {esperaEnFrase(d.esperaOrigenDespues)},{" "}
                        {d.origenDentroDeMeta ? "dentro de la meta." : "fuera de la meta."}
                      </p>
                    </>
                  ) : (
                    <p className={s.estado === "aprobada" ? "verde" : "sug-texto"}>
                      {s.estado === "aprobada" ? "Aprobada" : "Rechazada"}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
          <p className="chico" style={{ marginTop: 8 }}>
            El sistema solo sugiere. La decisión final siempre es de una persona.
          </p>
          <div className="acciones-col">
            <Link href="/alertas" className="btn btn-secundario">
              Aprobar o rechazar
            </Link>
            <Link href="/que-pasa-si" className="enlace">
              Probar otro movimiento
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
