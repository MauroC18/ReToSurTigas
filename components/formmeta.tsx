"use client";

import { useState, useTransition } from "react";
import { actualizarMetaAction } from "@/lib/actions";

export function FormMeta({ meta }: { meta: number }) {
  const [valor, setValor] = useState(String(meta));
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enviando, iniciar] = useTransition();

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setOk(false);
    iniciar(async () => {
      const resultado = await actualizarMetaAction(Number(valor));
      if (!resultado.ok) return setError(resultado.error);
      setError(null);
      setOk(true);
    });
  }

  return (
    <form onSubmit={guardar} noValidate>
      <div className="campo">
        <label htmlFor="meta">Espera máxima aceptable (minutos)</label>
        <input
          id="meta"
          type="number"
          min={1}
          max={60}
          value={valor}
          aria-invalid={error ? true : undefined}
          onChange={(e) => setValor(e.target.value)}
        />
        <span className="chico">
          Todas las pantallas usan esta meta para decir si una oficina está bien o necesita ayuda.
        </span>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primario" disabled={enviando} style={{ marginTop: 16 }}>
        {enviando ? "Guardando…" : "Guardar meta"}
      </button>
      {ok && (
        <p className="exito" role="status">
          Meta actualizada a {Number(valor)} min.
        </p>
      )}
    </form>
  );
}