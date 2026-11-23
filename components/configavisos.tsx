"use client";

import { useState } from "react";

export function ConfigAvisos() {
  const [espera, setEspera] = useState("10");
  const [anticipacion, setAnticipacion] = useState("60");
  const [correo, setCorreo] = useState(true);
  const [whatsapp, setWhatsapp] = useState(true);

  return (
    <section className="card" aria-labelledby="cuando">
      <h2 id="cuando">Cuándo se envía un aviso</h2>
      <div className="campo">
        <label htmlFor="espera-max">Espera máxima aceptable (minutos)</label>
        <input id="espera-max" type="number" min={1} value={espera} onChange={(e) => setEspera(e.target.value)} />
        <span className="chico">Si se estima una espera mayor, se genera el aviso.</span>
      </div>
      <div className="campo">
        <label htmlFor="anticipacion">Avisar con anticipación (minutos)</label>
        <input
          id="anticipacion"
          type="number"
          min={0}
          value={anticipacion}
          onChange={(e) => setAnticipacion(e.target.value)}
        />
      </div>
      <fieldset className="campo" style={{ border: 0, padding: 0, margin: "16px 0 0" }}>
        <legend className="rotulo" style={{ padding: 0 }}>Canales</legend>
        <div className="casillas">
          <label>
            <input type="checkbox" checked={correo} onChange={(e) => setCorreo(e.target.checked)} /> Correo
          </label>
          <label>
            <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} /> WhatsApp
          </label>
        </div>
      </fieldset>
      <p className="chico" style={{ marginTop: 8 }}>Valores de ejemplo. Los define Surtigas.</p>
    </section>
  );
}