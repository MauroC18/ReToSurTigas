"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restablecerDatosAction } from "@/lib/actionsrestablecer";

export function RestablecerDatos() {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [listo, setListo] = useState(false);
  const [cargando, iniciar] = useTransition();

  function restablecer() {
    iniciar(async () => {
      await restablecerDatosAction();
      setConfirmando(false);
      setListo(true);
      router.refresh();
    });
  }

  return (
    <div>
      <p>
        Vuelve a los datos de ejemplo: borra las sugerencias aprobadas, las ausencias registradas y los datos cargados
        desde archivo, y la meta vuelve a 30 minutos.
      </p>
      {!confirmando ? (
        <button type="button" onClick={() => { setListo(false); setConfirmando(true); }} disabled={cargando}>
          Restablecer datos de ejemplo
        </button>
      ) : (
        <div>
          <strong>¿Seguro? Se pierde todo lo hecho hasta ahora.</strong>{" "}
          <button type="button" onClick={restablecer} disabled={cargando}>
            {cargando ? "Restableciendo…" : "Sí, restablecer"}
          </button>{" "}
          <button type="button" onClick={() => setConfirmando(false)} disabled={cargando}>
            Cancelar
          </button>
        </div>
      )}
      {listo && <p role="status">Listo: los datos de ejemplo están de vuelta.</p>}
    </div>
  );
}