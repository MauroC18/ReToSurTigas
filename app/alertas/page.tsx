import Link from "next/link";
import { FRANJAS } from "@/lib/datos";
import {
  contarPendientes,
  detalleSugerencia,
  esperaEnFrase,
  rangoCorto,
  rangoFranja,
  textoFranjas,
} from "@/lib/analisis";
import { obtenerEstado } from "@/lib/api";
import { decidirAction } from "@/lib/actions";
import { ConfigAvisos } from "@/components/configavisos";
import { Encabezado, Pildora } from "@/components/ui";

function Decision({
  id,
  estado,
  clase,
  children,
}: {
  id: string;
  estado: string;
  clase: string;
  children: React.ReactNode;
}) {
  return (
    <form action={decidirAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="estado" value={estado} />
      <button type="submit" className={clase}>
        {children}
      </button>
    </form>
  );
}

export default async function Alertas() {
  const { oficinas, meta, sugerencias } = await obtenerEstado();
  const nPend = contarPendientes(sugerencias);
  const detalles = sugerencias.map((s) => detalleSugerencia(oficinas, meta, s));
  const ejemplo = detalles.find((d) => d.destinoFueraDeMeta);
  const franjaAviso = ejemplo ? FRANJAS[ejemplo.franjasProblema[0]!]! : undefined;

  return (
    <>
      <Encabezado
        titulo="Alertas y sugerencias"
        sub="El sistema avisa antes de que se forme la fila y propone un movimiento. Una persona aprueba o rechaza."
        accion={
          <Pildora tono={nPend > 0 ? "mal" : "neutro"}>
            {nPend} {nPend === 1 ? "pendiente" : "pendientes"}
          </Pildora>
        }
      />

      <div className="dos-col">
        <div className="col-pila">
          {detalles.length === 0 && (
            <section className="card">
              <h2>Sin sugerencias por ahora</h2>
              <p className="sub">
                Con el personal de hoy ninguna oficina tiene holgura para apoyar a otra en las franjas con fila.
              </p>
            </section>
          )}
          {detalles.map((d) => {
            const s = d.sugerencia;
            const cuando = s.franjas.map((id) => rangoFranja(FRANJAS.find((f) => f.id === id)!)).join(" y ");
            return (
              <article key={s.id} className="card" aria-labelledby={`sug-${s.id}`}>
                <div className="alerta-titulo">
                  <h2 id={`sug-${s.id}`}>{d.destino.nombre}</h2>
                  {d.destinoFueraDeMeta ? (
                    <Pildora tono="mal">Fila larga prevista</Pildora>
                  ) : (
                    <Pildora tono="bien">Dentro de la meta</Pildora>
                  )}
                </div>
                <p className="sug-texto" style={{ marginTop: 8 }}>
                  {d.destinoFueraDeMeta
                    ? `Se estima una espera de hasta ${esperaEnFrase(d.esperaDestinoDia)} ${textoFranjas(d.franjasProblema)} La meta es ${meta} min.`
                    : `Con el personal de hoy la espera estimada queda dentro de la meta de ${meta} min.`}
                </p>

                <div className="caja-sug">
                  <div className="etiqueta">Sugerencia</div>
                  <div className="accion">
                    Mover {s.personas} {s.personas === 1 ? "persona" : "personas"} desde {d.origen.nombre}{" "}
                    {s.modalidad === "virtual" ? "(apoyo virtual, sin viajar)" : "(presencial)"} en {cuando}
                  </div>
                  <p className="verde">
                    En esa franja la espera bajaría de {esperaEnFrase(d.esperaDestinoAntes)} a{" "}
                    {esperaEnFrase(d.esperaDestinoDespues)}.
                  </p>
                  {d.esperaDestinoDespues > meta && (
                    <p className="chico" style={{ marginTop: 4 }}>
                      Mejora, pero sigue por encima de la meta de {meta} min: hace falta más personal en esa franja.
                    </p>
                  )}
                  <p className="chico" style={{ marginTop: 4 }}>
                    {d.origen.nombre} quedaría con una espera de {esperaEnFrase(d.esperaOrigenDespues)},{" "}
                    {d.origenDentroDeMeta ? "dentro de la meta." : "fuera de la meta."}
                  </p>
                </div>

                {s.estado === "pendiente" && (
                  <div className="fila-botones">
                    <Decision id={s.id} estado="aprobada" clase="btn btn-primario">
                      Aprobar
                    </Decision>
                    <Decision id={s.id} estado="rechazada" clase="btn btn-secundario">
                      Rechazar
                    </Decision>
                    <Link href="/que-pasa-si" className="enlace">
                      Probar otra opción
                    </Link>
                  </div>
                )}
                {s.estado === "aprobada" && (
                  <div className="banda ok">
                    <span>Aprobada. Se avisará a la persona y a las dos oficinas, y quedará registrada.</span>
                    <Decision id={s.id} estado="pendiente" clase="enlace">
                      Deshacer
                    </Decision>
                  </div>
                )}
                {s.estado === "rechazada" && (
                  <div className="banda no">
                    <span>Rechazada. Queda registrada y la oficina sigue con fila prevista.</span>
                    <Decision id={s.id} estado="pendiente" clase="enlace">
                      Deshacer
                    </Decision>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <div className="col-pila">
          <section className="card" aria-labelledby="aviso">
            <h2 id="aviso">Así llega el aviso</h2>
            <p className="sub">Por WhatsApp o por correo, según lo que se configure</p>
            <div className="burbuja">
              {ejemplo && franjaAviso ? (
                <p>
                  {ejemplo.destino.nombre}: se estima una espera de hasta {esperaEnFrase(ejemplo.esperaDestinoAntes)} entre{" "}
                  {rangoCorto(franjaAviso.inicio, franjaAviso.fin).replace(" – ", " y ")} Sugerencia: apoyo desde{" "}
                  {ejemplo.origen.nombre}, con lo que bajaría a {esperaEnFrase(ejemplo.esperaDestinoDespues)}. Revisa y decide
                  en el panel.
                </p>
              ) : (
                <p>Hoy no hay avisos por fila larga.</p>
              )}
            </div>
            <p className="chico" style={{ marginTop: 8 }}>Panel de turnos · 8:00 a. m.</p>
          </section>
          <ConfigAvisos meta={meta} />
        </div>
      </div>
    </>
  );
}