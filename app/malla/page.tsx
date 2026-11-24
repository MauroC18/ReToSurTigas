import Link from "next/link";
import { FECHA_LARGA, FRANJAS } from "@/lib/datos";
import {
  agruparMalla,
  diferenciaConApoyos,
  esperasConApoyos,
  etiquetasApoyo,
  necesariosMax,
  rangoFranja,
  resumenMalla,
} from "@/lib/analisis";
import { formatoEspera } from "@/lib/erlang";
import { obtenerEstado } from "@/lib/api";
import { Encabezado, Pildora } from "@/components/ui";
import type { Oficina, Sugerencia } from "@/lib/tipos";

function esperaCelda(w: number): string {
  return Number.isFinite(w) && w <= 60 ? `Espera ≈ ${formatoEspera(w)}` : "Espera: más de 60 min";
}

function Fila({
  o,
  oficinas,
  sugerencias,
  meta,
  conAccion,
}: {
  o: Oficina;
  oficinas: Oficina[];
  sugerencias: Sugerencia[];
  meta: number;
  conAccion: boolean;
}) {
  const dif = diferenciaConApoyos(o, meta, sugerencias);
  const esperas = esperasConApoyos(o, sugerencias);
  const etiquetas = etiquetasApoyo(o, oficinas, sugerencias);
  const tieneSugerencia = sugerencias.some((s) => s.destinoId === o.id);
  return (
    <tr className="oficina-fila">
      <td>
        <span className="nombre">{o.nombre}</span>
        <span className="chico">
          Hay {o.hay} · Se necesitan hasta {necesariosMax(o, meta)}
        </span>
        {etiquetas.map((t) => (
          <span key={t} className="chico" style={{ display: "block" }}>
            {t}
          </span>
        ))}
      </td>
      {dif.map((d, i) => (
        <td key={i}>
          {d < 0 ? (
            <div className="celda mal">
              Falta {-d}
              <small>{esperaCelda(esperas[i]!)}</small>
            </div>
          ) : d > 0 ? (
            <div className="celda sobra">Sobra {d}</div>
          ) : (
            <div className="celda justo">Justo</div>
          )}
        </td>
      ))}
      <td>
        {conAccion && tieneSugerencia && (
          <Link href="/alertas" className="enlace">
            Ver sugerencia
          </Link>
        )}
      </td>
    </tr>
  );
}

function Grupo({
  titulo,
  nota,
  oficinas,
  todas,
  sugerencias,
  meta,
  conAccion,
}: {
  titulo: string;
  nota: string;
  oficinas: Oficina[];
  todas: Oficina[];
  sugerencias: Sugerencia[];
  meta: number;
  conAccion: boolean;
}) {
  return (
    <>
      <tr className="grupo-barra">
        <td colSpan={7}>
          <div className="barra">
            <span className="titulo">
              {titulo} ({oficinas.length} {oficinas.length === 1 ? "oficina" : "oficinas"})
            </span>
            <span className="nota">{nota}</span>
          </div>
        </td>
      </tr>
      {oficinas.map((o) => (
        <Fila key={o.id} o={o} oficinas={todas} sugerencias={sugerencias} meta={meta} conAccion={conAccion} />
      ))}
    </>
  );
}

export default async function MallaSugerida() {
  const { oficinas, meta, sugerencias } = await obtenerEstado();
  const { ayuda, apoyo, bien } = agruparMalla(oficinas, meta);

  return (
    <>
      <Encabezado
        titulo="Malla sugerida para hoy"
        sub={`Qué oficinas necesitan más o menos personas, hora por hora · ${FECHA_LARGA}`}
        accion={
          <button type="button" className="btn btn-secundario">
            Exportar a Excel
          </button>
        }
      />

      <section className="resumen" aria-labelledby="resumen-malla">
        <h2 id="resumen-malla">Resumen del día</h2>
        <p>{resumenMalla(oficinas, meta)}</p>
      </section>

      <section className="leyenda" aria-label="Cómo leer la tabla">
        <div className="card">
          <Pildora tono="mal">Falta 1</Pildora>
          <span>Hay una persona menos de las necesarias. Se espera fila más larga que la meta.</span>
        </div>
        <div className="card">
          <Pildora tono="info">Sobra 1</Pildora>
          <span>Hay una persona más de las necesarias. Puede apoyar a otra oficina.</span>
        </div>
        <div className="card">
          <Pildora tono="neutro">Justo</Pildora>
          <span>Hay exactamente las personas necesarias.</span>
        </div>
      </section>
      <p className="chico" style={{ marginBottom: 14 }}>
        Se necesitan las personas que hagan falta para que un cliente espere máximo {meta} minutos, según las llegadas por
        hora y el tiempo de atención de Digiturno.
      </p>

      <section className="card tabla-scroll" style={{ padding: 0 }}>
        <table className="malla">
          <thead>
            <tr>
              <th scope="col">Oficina</th>
              {FRANJAS.map((f) => (
                <th key={f.id} scope="col">
                  {f.id}
                  {f.pico && <small>Hora pico</small>}
                  <small>{rangoFranja(f)}</small>
                </th>
              ))}
              <th scope="col">Acción</th>
            </tr>
          </thead>
          <tbody>
            {ayuda.length > 0 && (
              <Grupo
                titulo="Necesitan ayuda"
                nota="Hay menos personas de las necesarias en alguna franja"
                oficinas={ayuda}
                todas={oficinas}
                sugerencias={sugerencias}
                meta={meta}
                conAccion
              />
            )}
            {apoyo.length > 0 && (
              <Grupo
                titulo="Pueden ayudar todo el día"
                nota="Tienen más personas de las necesarias"
                oficinas={apoyo}
                todas={oficinas}
                sugerencias={sugerencias}
                meta={meta}
                conAccion={false}
              />
            )}
            {bien.length > 0 && (
              <Grupo
                titulo="Sin problemas"
                nota="Tienen justo lo necesario, con algo de sobrante en las horas tranquilas"
                oficinas={bien}
                todas={oficinas}
                sugerencias={sugerencias}
                meta={meta}
                conAccion={false}
              />
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}