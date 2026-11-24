"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function ahora(): string {
  return new Date().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

/** Vuelve a cargar los datos de la pantalla cada cierto tiempo y muestra la hora de la última carga. */
export function AutoRefresco({ segundos = 30 }: { segundos?: number }) {
  const router = useRouter();
  const [hora, setHora] = useState(ahora);
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    if (!activo) return;
    const id = setInterval(() => {
      router.refresh();
      setHora(ahora());
    }, segundos * 1000);
    return () => clearInterval(id);
  }, [activo, segundos, router]);

  return (
    <div className="chico" role="status" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <span suppressHydrationWarning>
        Actualizado a las {hora}
        {activo ? ` · se actualiza cada ${segundos} s` : " · actualización pausada"}
      </span>
      <button type="button" className="enlace" onClick={() => setActivo((a) => !a)}>
        {activo ? "Pausar" : "Reanudar"}
      </button>
    </div>
  );
}