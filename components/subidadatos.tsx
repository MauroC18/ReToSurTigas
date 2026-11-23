"use client";

import { useState } from "react";

export function SubidaDatos() {
  const [nombre, setNombre] = useState<string | null>(null);
  return (
    <div className="subida">
      <p>Elige el archivo de Digiturno (.xlsx o .csv)</p>
      <input
        type="file"
        accept=".xlsx,.csv"
        aria-label="Archivo de Digiturno"
        onChange={(e) => setNombre(e.target.files?.[0]?.name ?? null)}
      />
      {nombre && (
        <p className="exito" role="status">
          Archivo listo: {nombre}. En la demo no se procesa; se usan los datos de ejemplo.
        </p>
      )}
    </div>
  );
}