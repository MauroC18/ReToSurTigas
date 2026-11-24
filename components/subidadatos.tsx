"use client";

import { useState, useTransition } from "react";
import { aplicarImportacionAction } from "@/lib/actionsimportar";
import { importarDigiturno } from "@/lib/importar";
import type { Oficina } from "@/lib/tipos";

type Mensaje = { tipo: "exito" | "error"; texto: string; detalle?: string };

export function SubidaDatos({ oficinas }: { oficinas: Oficina[] }) {
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [cargando, iniciar] = useTransition();

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const entrada = e.target;
    const archivo = entrada.files?.[0];
    if (!archivo) return;

    if (!archivo.name.toLowerCase().endsWith(".csv")) {
      setMensaje({ tipo: "error", texto: "Por ahora solo se lee .csv. En Excel: Guardar como → CSV." });
      entrada.value = "";
      return;
    }

    // El archivo se lee en el navegador: al servidor solo llegan los promedios calculados.
    const resultado = importarDigiturno(await archivo.text(), oficinas);
    entrada.value = "";
    if (!resultado.ok) {
      setMensaje({ tipo: "error", texto: resultado.error });
      return;
    }

    iniciar(async () => {
      const aplicado = await aplicarImportacionAction(resultado.oficinas);
      if (!aplicado.ok) {
        setMensaje({ tipo: "error", texto: aplicado.error });
        return;
      }
      const partes = [
        `${resultado.filasLeidas} filas leídas de ${resultado.dias} ${resultado.dias === 1 ? "día" : "días"}`,
        `${aplicado.actualizadas} ${aplicado.actualizadas === 1 ? "oficina actualizada" : "oficinas actualizadas"}`,
      ];
      if (resultado.filasDescartadas > 0) partes.push(`${resultado.filasDescartadas} filas descartadas`);
      setMensaje({
        tipo: "exito",
        texto: `Archivo cargado: ${partes.join(" · ")}.`,
        detalle:
          resultado.sinDatos.length > 0
            ? `Sin datos en el archivo (se dejan los de ejemplo): ${resultado.sinDatos.join(", ")}.`
            : undefined,
      });
    });
  }

  return (
    <div className="subida">
      <p>Elige el archivo de Digiturno (.csv)</p>
      <input type="file" accept=".csv" aria-label="Archivo de Digiturno" disabled={cargando} onChange={alElegir} />
      <p className="chico">
        Una fila por turno atendido, con las columnas <strong>oficina</strong>, <strong>fecha</strong> (aaaa-mm-dd),{" "}
        <strong>hora</strong> y <strong>minutos_atencion</strong>. El archivo se lee en tu navegador y no se guarda.
      </p>
      {cargando && <p role="status">Calculando…</p>}
      {mensaje && (
        <p className={mensaje.tipo === "exito" ? "exito" : "mal-texto"} role={mensaje.tipo === "exito" ? "status" : "alert"}>
          {mensaje.texto}
        </p>
      )}
      {mensaje?.detalle && <p className="chico">{mensaje.detalle}</p>}
    </div>
  );
}