"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const OPCIONES = [
  { href: "/panel", etiqueta: "Panel del día" },
  { href: "/malla", etiqueta: "Malla sugerida" },
  { href: "/que-pasa-si", etiqueta: "¿Qué pasa si…?" },
  { href: "/alertas", etiqueta: "Alertas" },
  { href: "/ausencia", etiqueta: "Ausencias" },
  { href: "/datos", etiqueta: "Datos y metas" },
];

export function Sidebar({ pendientes }: { pendientes: number }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  return (
    <aside className="sidebar">
      <div className="sidebar-cabecera">
        <div>
          <h2>Panel de turnos</h2>
          <p className="version">Versión B · con teoría de colas</p>
        </div>
        <button
          type="button"
          className="menu-btn"
          aria-expanded={abierto}
          aria-controls="menu-principal"
          onClick={() => setAbierto(!abierto)}
        >
          {abierto ? "Cerrar" : "Menú"}
          {!abierto && pendientes > 0 && (
            <span className="insignia" aria-label={`${pendientes} pendientes`}>
              {pendientes}
            </span>
          )}
        </button>
      </div>
      <nav id="menu-principal" aria-label="Principal" className={abierto ? "abierto" : undefined}>
        {OPCIONES.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className="nav-link"
            aria-current={ruta === o.href ? "page" : undefined}
            onClick={() => setAbierto(false)}
          >
            {o.etiqueta}
            {o.href === "/alertas" && pendientes > 0 && (
              <span className="insignia" aria-label={`${pendientes} pendientes`}>
                {pendientes}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <p className="pie">Los datos que ves aquí son de ejemplo.</p>
    </aside>
  );
}