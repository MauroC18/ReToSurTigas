import { buscarOficina, etiquetaFechas, plural } from "@/lib/analisis";
import { obtenerEstado } from "@/lib/api";
import { FormAusencia } from "@/components/formausencia";
import { Encabezado, Pildora } from "@/components/ui";

export default async function Ausencias() {
  const { oficinas, ausencias } = await obtenerEstado();
  return (
    <>
      <Encabezado
        titulo="Ausencias"
        sub="Registra quién no va a estar. El sistema descuenta a esa persona y recalcula cada oficina."
      />
      <div className="dos-col">
        <section className="card" aria-labelledby="nueva">
          <h2 id="nueva">Registrar una ausencia</h2>
          <FormAusencia oficinas={oficinas} />
        </section>
        <section className="card" aria-labelledby="lista">
          <h2 id="lista">Ausencias registradas</h2>
          <p className="sub">
            {ausencias.length} {plural(ausencias.length, "persona ausente", "personas ausentes")} hoy
          </p>
          <ul className="lista-aus">
            {ausencias.map((a) => (
              <li key={a.id}>
                <div>
                  <strong>{a.colaborador}</strong>
                  <div className="detalle">
                    {buscarOficina(oficinas, a.oficinaId).nombre} · {etiquetaFechas(a.desde, a.hasta)}
                  </div>
                </div>
                <Pildora tono="neutro">{a.tipo}</Pildora>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}