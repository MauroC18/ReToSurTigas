import { OFICINAS_RESUMEN_DATOS } from "@/lib/datos";
import { buscarOficina } from "@/lib/analisis";
import { obtenerEstado } from "@/lib/api";
import { FormMeta } from "@/components/formmeta";
import { SubidaDatos } from "@/components/subidadatos";
import { Encabezado } from "@/components/ui";

const PASOS = ["Subir el archivo", "Revisar las columnas", "Ver el resumen", "Definir la meta"];

const COLUMNAS = [
  ["Oficina", "Dónde se atendió"],
  ["Fecha y hora de llegada", "Para contar clientes por franja"],
  ["Tiempo de atención", "Para calcular los minutos por atención"],
  ["Tiempo de espera", "Para comparar con lo estimado"],
];

export default async function Datos() {
  const { oficinas, meta } = await obtenerEstado();
  return (
    <>
      <Encabezado
        titulo="Datos y metas"
        sub="Aquí se cargan los datos de Digiturno y se define cuánta espera se considera aceptable."
      />

      <ol className="pasos" aria-label="Pasos">
        {PASOS.map((p, i) => (
          <li key={p} className="card paso-tarjeta">
            <span className="numero">{i + 1}</span>
            {p}
          </li>
        ))}
      </ol>

      <div className="dos-col">
        <div className="col-pila">
          <section className="card" aria-labelledby="subir">
            <h2 id="subir">1. Subir el archivo de Digiturno</h2>
            <SubidaDatos />
          </section>
          <section className="card" aria-labelledby="cols">
            <h2 id="cols">2. Columnas que se leen</h2>
            <ul className="lista-cols">
              {COLUMNAS.map(([nombre, para]) => (
                <li key={nombre}>
                  <strong>{nombre}</strong>
                  <span className="chico">{para}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="col-pila">
          <section className="card" aria-labelledby="resumen">
            <h2 id="resumen">3. Resumen de ejemplo</h2>
            <p className="sub">Promedios de las últimas 8 semanas, solo viernes. Datos de ejemplo.</p>
            <ul className="datos-resumen">
              {OFICINAS_RESUMEN_DATOS.map((id) => {
                const o = buscarOficina(oficinas, id);
                return (
                  <li key={id}>
                    <span>{o.nombre}</span>
                    <span className="chico">
                      hasta {Math.max(...o.llegadas)} clientes por hora · {o.s} min por atención
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="card" aria-labelledby="meta-t">
            <h2 id="meta-t">4. Meta de espera</h2>
            <FormMeta meta={meta} />
          </section>
        </div>
      </div>
    </>
  );
}