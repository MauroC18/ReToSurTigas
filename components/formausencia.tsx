"use client";

import { useState, useTransition } from "react";
import { FECHA_HOY } from "@/lib/datos";
import { TIPOS_AUSENCIA, type Oficina, type TipoAusencia } from "@/lib/tipos";
import { guardarAusenciaAction } from "@/lib/actions";

export function FormAusencia({ oficinas }: { oficinas: Oficina[] }) {
  const [colaborador, setColaborador] = useState("");
  const [oficinaId, setOficinaId] = useState(oficinas[0]?.id ?? "");
  const [tipo, setTipo] = useState<TipoAusencia>("Incapacidad");
  const [desde, setDesde] = useState(FECHA_HOY);
  const [hasta, setHasta] = useState(FECHA_HOY);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setExito(null);
    // Revisión rápida para avisar sin ir al servidor. El servidor vuelve a validar.
    if (!colaborador.trim()) return setError("Escribe el nombre del colaborador");
    if (hasta < desde) return setError("La fecha final no puede ser anterior a la inicial");
    setError(null);

    iniciar(async () => {
      const resultado = await guardarAusenciaAction({ colaborador, oficinaId, tipo, desde, hasta });
      if (!resultado.ok) return setError(resultado.error);
      setExito("Ausencia registrada. Los cálculos ya la tienen en cuenta.");
      setColaborador("");
    });
  }

  return (
    <form onSubmit={enviar} noValidate>
      <div className="campo">
        <label htmlFor="colaborador">Colaborador</label>
        <input
          id="colaborador"
          type="text"
          value={colaborador}
          onChange={(e) => setColaborador(e.target.value)}
          aria-invalid={error && !colaborador.trim() ? true : undefined}
          placeholder="Ej. Colaborador 12"
        />
      </div>
      <div className="campo">
        <label htmlFor="oficina">Oficina</label>
        <select id="oficina" value={oficinaId} onChange={(e) => setOficinaId(e.target.value)}>
          {oficinas.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="tipo">Motivo</label>
        <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoAusencia)}>
          {TIPOS_AUSENCIA.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="fila-2">
        <div className="campo">
          <label htmlFor="desde">Desde</label>
          <input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="hasta">Hasta</label>
          <input id="hasta" type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primario btn-bloque" disabled={enviando} style={{ marginTop: 16 }}>
        {enviando ? "Guardando…" : "Registrar ausencia"}
      </button>
      {exito && (
        <p className="exito" role="status">
          {exito}
        </p>
      )}
    </form>
  );
}