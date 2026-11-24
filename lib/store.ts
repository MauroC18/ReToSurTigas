import postgres from "postgres";
import { estadoInicial } from "./datos";
import { proponerApoyos } from "./motor";
import type { Ausencia, Estado, Modalidad, Oficina, Sugerencia, TipoAusencia, EstadoSugerencia } from "./tipos";

type Tx = postgres.TransactionSql;

const g = globalThis as unknown as { __estado?: Estado; __sql?: postgres.Sql };

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
    max: 3,
    idle_timeout: 20,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require",
  });
  return g.__sql;
}

async function cargar(tx: Tx): Promise<Estado | null> {
  const [config] = await tx<{ meta: number }[]>`select meta from configuracion where id = 1`;
  if (!config) return null;

  const oficinas = await tx<Oficina[]>`
    select id, nombre, s, hay, llegadas from oficinas order by orden`;
  const ausencias = await tx<{ id: string; colaborador: string; oficinaId: string; tipo: TipoAusencia; desde: string; hasta: string }[]>`
    select id, colaborador, oficina_id as "oficinaId", tipo, desde::text as desde, hasta::text as hasta
    from ausencias order by id`;
  const sugerencias = await tx<
    { id: string; origenId: string; destinoId: string; personas: number; modalidad: Modalidad; franjas: string[]; estado: EstadoSugerencia }[]
  >`
    select id, origen_id as "origenId", destino_id as "destinoId", personas, modalidad, franjas, estado
    from sugerencias order by id`;

  return {
    meta: config.meta,
    oficinas: oficinas.map((o) => ({ id: o.id, nombre: o.nombre, s: o.s, hay: o.hay, llegadas: [...o.llegadas] })),
    ausencias: ausencias.map((a): Ausencia => ({ ...a })),
    sugerencias: sugerencias.map((s): Sugerencia => ({ ...s, franjas: [...s.franjas] })),
  };
}

async function guardar(tx: Tx, e: Estado): Promise<void> {
  await tx`insert into configuracion (id, meta) values (1, ${e.meta}) on conflict (id) do update set meta = excluded.meta`;

  for (const [i, o] of e.oficinas.entries()) {
    await tx`
      insert into oficinas (id, nombre, s, hay, llegadas, orden)
      values (${o.id}, ${o.nombre}, ${o.s}, ${o.hay}, ${o.llegadas}::float8[], ${i})
      on conflict (id) do update
        set nombre = excluded.nombre, s = excluded.s, hay = excluded.hay, llegadas = excluded.llegadas, orden = excluded.orden`;
  }

  await tx`delete from sugerencias`;
  await tx`delete from ausencias`;

  for (const a of e.ausencias) {
    await tx`
      insert into ausencias (id, colaborador, oficina_id, tipo, desde, hasta)
      values (${a.id}, ${a.colaborador}, ${a.oficinaId}, ${a.tipo}, ${a.desde}, ${a.hasta})`;
  }
  for (const s of e.sugerencias) {
    await tx`
      insert into sugerencias (id, origen_id, destino_id, personas, modalidad, franjas, estado)
      values (${s.id}, ${s.origenId}, ${s.destinoId}, ${s.personas}, ${s.modalidad}, ${s.franjas}::text[], ${s.estado})`;
  }
}

async function conBase<T>(sql: postgres.Sql, trabajo: (tx: Tx, e: Estado) => Promise<T>): Promise<T> {
  return (await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(7001)`; 
    let estado = await cargar(tx);
    if (!estado) {
      estado = crearEstado();
      await guardar(tx, estado);
    }
    return trabajo(tx, estado);
  })) as T;
}

export async function leerEstado(): Promise<Estado> {
  const sql = conexion();
  if (!sql) {
    g.__estado ??= crearEstado();
    return g.__estado;
  }
  return conBase(sql, async (_tx, e) => e);
}

export async function escribirEstado(cambio: (e: Estado) => void): Promise<void> {
  const sql = conexion();
  if (!sql) {
    cambio(await leerEstado());
    return;
  }
  await conBase(sql, async (tx, e) => {
    cambio(e);
    await guardar(tx, e);
  });
}