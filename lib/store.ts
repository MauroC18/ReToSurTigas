import postgres from "postgres";
import { estadoInicial } from "./datos";
import { proponerApoyos } from "./motor";
import type { Ausencia, Estado, Oficina, Sugerencia } from "./tipos";

type Conexion = postgres.Sql | postgres.TransactionSql;

const g = globalThis as unknown as { __estado?: Estado; __sql?: postgres.Sql };

/** Datos de ejemplo más las sugerencias que calcula el motor. */
function crearEstado(): Estado {
  const e = estadoInicial();
  e.sugerencias = proponerApoyos(e.oficinas, e.meta);
  return e;
}

function conexion(): postgres.Sql | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  g.__sql ??= postgres(url, {
    prepare: false,
    max: process.env.VERCEL ? 3 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require",
  });
  return g.__sql;
}

type Datos = { meta: number | null; oficinas: Oficina[]; ausencias: Ausencia[]; sugerencias: Sugerencia[] };

async function cargar(sql: Conexion): Promise<Estado | null> {
  const [fila] = await sql<{ datos: Datos | string }[]>`
    select json_build_object(
      'meta', (select meta from configuracion where id = 1),
      'oficinas', (
        select coalesce(json_agg(json_build_object(
          'id', id, 'nombre', nombre, 's', s, 'hay', hay, 'llegadas', llegadas) order by orden), '[]'::json)
        from oficinas),
      'ausencias', (
        select coalesce(json_agg(json_build_object(
          'id', id, 'colaborador', colaborador, 'oficinaId', oficina_id, 'tipo', tipo,
          'desde', desde::text, 'hasta', hasta::text) order by id), '[]'::json)
        from ausencias),
      'sugerencias', (
        select coalesce(json_agg(json_build_object(
          'id', id, 'origenId', origen_id, 'destinoId', destino_id, 'personas', personas,
          'modalidad', modalidad, 'franjas', franjas, 'estado', estado) order by id), '[]'::json)
        from sugerencias)
    ) as datos`;

  const d: Datos | undefined = typeof fila?.datos === "string" ? JSON.parse(fila.datos) : fila?.datos;
  if (!d || d.meta === null || d.meta === undefined) return null;

  return {
    meta: d.meta,
    oficinas: d.oficinas.map((o) => ({ ...o, llegadas: [...o.llegadas] })),
    ausencias: d.ausencias.map((a) => ({ ...a })),
    sugerencias: d.sugerencias.map((s) => ({ ...s, franjas: [...s.franjas] })),
  };
}

const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Escribe solo lo que cambió entre `antes` y `ahora`, una consulta a la vez. */
async function guardar(tx: Conexion, antes: Estado | null, ahora: Estado): Promise<void> {
  if (!antes || antes.meta !== ahora.meta) {
    await tx`insert into configuracion (id, meta) values (1, ${ahora.meta}) on conflict (id) do update set meta = excluded.meta`;
  }

  // Las oficinas van primero: ausencias y sugerencias dependen de ellas.
  for (const [i, o] of ahora.oficinas.entries()) {
    if (igual(antes?.oficinas[i], o)) continue;
    await tx`
      insert into oficinas (id, nombre, s, hay, llegadas, orden)
      values (${o.id}, ${o.nombre}, ${o.s}, ${o.hay}, ${o.llegadas}::float8[], ${i})
      on conflict (id) do update
        set nombre = excluded.nombre, s = excluded.s, hay = excluded.hay, llegadas = excluded.llegadas, orden = excluded.orden`;
  }

  const ausenciasAntes = new Map((antes?.ausencias ?? []).map((a) => [a.id, a]));
  const ausenciasQuitadas = [...ausenciasAntes.keys()].filter((id) => !ahora.ausencias.some((a) => a.id === id));
  if (ausenciasQuitadas.length > 0) await tx`delete from ausencias where id = any(${ausenciasQuitadas}::text[])`;
  for (const a of ahora.ausencias) {
    if (igual(ausenciasAntes.get(a.id), a)) continue;
    await tx`
      insert into ausencias (id, colaborador, oficina_id, tipo, desde, hasta)
      values (${a.id}, ${a.colaborador}, ${a.oficinaId}, ${a.tipo}, ${a.desde}, ${a.hasta})
      on conflict (id) do update
        set colaborador = excluded.colaborador, oficina_id = excluded.oficina_id, tipo = excluded.tipo,
            desde = excluded.desde, hasta = excluded.hasta`;
  }

  const sugerenciasAntes = new Map((antes?.sugerencias ?? []).map((s) => [s.id, s]));
  const sugerenciasQuitadas = [...sugerenciasAntes.keys()].filter((id) => !ahora.sugerencias.some((s) => s.id === id));
  if (sugerenciasQuitadas.length > 0) await tx`delete from sugerencias where id = any(${sugerenciasQuitadas}::text[])`;
  for (const s of ahora.sugerencias) {
    if (igual(sugerenciasAntes.get(s.id), s)) continue;
    await tx`
      insert into sugerencias (id, origen_id, destino_id, personas, modalidad, franjas, estado)
      values (${s.id}, ${s.origenId}, ${s.destinoId}, ${s.personas}, ${s.modalidad}, ${s.franjas}::text[], ${s.estado})
      on conflict (id) do update
        set origen_id = excluded.origen_id, destino_id = excluded.destino_id, personas = excluded.personas,
            modalidad = excluded.modalidad, franjas = excluded.franjas, estado = excluded.estado`;
  }
}

/** Llena la base vacía con los datos de ejemplo (una sola vez, aunque lleguen dos visitas a la vez). */
async function sembrar(sql: postgres.Sql): Promise<Estado> {
  return (await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(7001)`;
    const existente = await cargar(tx);
    if (existente) return existente;
    const nuevo = crearEstado();
    await guardar(tx, null, nuevo);
    return nuevo;
  })) as Estado;
}

export async function leerEstado(): Promise<Estado> {
  const sql = conexion();
  if (!sql) {
    g.__estado ??= crearEstado();
    return g.__estado;
  }
  return (await cargar(sql)) ?? (await sembrar(sql));
}

export async function escribirEstado(cambio: (e: Estado) => void): Promise<void> {
  const sql = conexion();
  if (!sql) {
    cambio(await leerEstado());
    return;
  }
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(7001)`; 
    const guardado = await cargar(tx); 
    const ahora = structuredClone(guardado ?? crearEstado());
    cambio(ahora);
    await guardar(tx, guardado, ahora);
  });
}

/** Borra todo y vuelve a los datos de ejemplo. */
export async function restablecerEstado(): Promise<void> {
  const sql = conexion();
  if (!sql) {
    g.__estado = crearEstado();
    return;
  }
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(7001)`;
    await tx`truncate table sugerencias, ausencias, oficinas, configuracion`;
    await guardar(tx, null, crearEstado());
  });
}