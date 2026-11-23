import type { ReactNode } from "react";

export type Tono = "mal" | "bien" | "info" | "neutro";

/** Etiqueta redondeada de color, como "Fuera de la meta". */
export function Pildora({ tono, children }: { tono: Tono; children: ReactNode }) {
  return <span className={`pildora ${tono}`}>{children}</span>;
}

/** Título de cada pantalla, con texto de apoyo y un botón opcional a la derecha. */
export function Encabezado({
  titulo,
  sub,
  accion,
}: {
  titulo: string;
  sub?: string;
  accion?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{titulo}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {accion}
    </header>
  );
}