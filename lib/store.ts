import postgres from "postgres";
import { estadoInicial } from "./datos";
import { proponerApoyos } from "./motor";
import type { Ausencia, Estado, EstadoSugerencia, Modalidad, Oficina, Sugerencia, TipoAusencia } from "./tipos";

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

type FilaSugerencia = {
  id: string;
  origenId?: string;
  origen_id?: string;
  destinoId?: string;
  destino_id?: string;
  personas: number;
  modalidad: Modalidad;
  franjas: string[];
  estado: EstadoSugerencia;
};
type FilaAusencia = {
  id: string;
  colaborador: string;
  oficinaId?: string;
  oficina_id?: string;
  tipo: TipoAusencia;
  desde: string;
  hasta: string;
};

/** Lee todo el estado con las cuatro consultas en paralelo. Devuelve null si la base está vacía. */
async function cargar(sql: Conexion): Promise<Estado | null> {
  const [configs, oficinas, ausencias, sugerencias] = await Promise.all([
    sql<{ meta: number }[]>`select meta from configuracion where id = 1`,
    sql<Oficina[]>`select id, nombre, s, hay, llegadas from oficinas order by orden`,
    sql<FilaAusencia[]>`
      select id, colaborador, oficina_id as "oficinaId", tipo, desde::text as desde, hasta::text as hasta
      from ausencias order by id`,
    sql<FilaSugerencia[]>`
      select id, origen_id as "origenId", destino_id as "destinoId", personas, modalidad, franjas, estado
      from sugerencias order by id`,
  ]);
  const config = configs[0];
  if (!config) return null;

  if (process.env.VERCEL) {
    console.log(`[VERCEL] oficinas: ${oficinas.length}, ausencias: ${ausencias.length}, sugerencias: ${sugerencias.length}, sugerencias[0] keys: ${sugerencias[0] ? Object.keys(sugerencias[0]).join(", ") : "none"}`);
  }

  return {
    meta: config.meta,
    oficinas: oficinas.map((o) => ({ id: o.id, nombre: o.nombre, s: o.s, hay: o.hay, llegadas: Array.isArray(o.llegadas) ? [...o.llegadas] : [] })),
    ausencias: ausencias
      .map((a): Ausencia => ({
        id: a.id,
        colaborador: a.colaborador,
        oficinaId: a.oficinaId ?? a.oficina_id ?? "",
        tipo: a.tipo,
        desde: String(a.desde),
        hasta: String(a.hasta),
      }))
      .filter((a) => Boolean(a.oficinaId)),
    sugerencias: sugerencias
      .map((s): Sugerencia => ({
        id: s.id,
        origenId: s.origenId ?? s.origen_id ?? "",
        destinoId: s.destinoId ?? s.destino_id ?? "",
        personas: Number(s.personas),
        modalidad: s.modalidad,
        estado: s.estado,
        franjas: Array.isArray(s.franjas)
          ? [...s.franjas]
          : typeof s.franjas === "string"
            ? (s.franjas as string).replace(/[{}]/g, "").split(",").map((f) => f.trim()).filter(Boolean)
            : [],
      }))
      .filter((s) => Boolean(s.origenId && s.destinoId)),
  };
}

const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

async function guardar(tx: Conexion, antes: Estado | null, ahora: Estado): Promise<void> {
  if (!antes || antes.meta !== ahora.meta) {
    await tx`insert into configuracion (id, meta) values (1, ${ahora.meta}) on conflict (id) do update set meta = excluded.meta`;
  }

  // Las oficinas van primero: ausencias y sugerencias dependen de ellas.
  const cambiadas = ahora.oficinas.filter((o, i) => !antes || !igual(antes.oficinas[i], o) || antes.oficinas[i]?.id !== o.id);
  await Promise.all(
    cambiadas.map(
      (o) => tx`
        insert into oficinas (id, nombre, s, hay, llegadas, orden)
        values (${o.id}, ${o.nombre}, ${o.s}, ${o.hay}, ${o.llegadas}::float8[], ${ahora.oficinas.indexOf(o)})
        on conflict (id) do update
          set nombre = excluded.nombre, s = excluded.s, hay = excluded.hay, llegadas = excluded.llegadas, orden = excluded.orden`,
    ),
  );

  const tareas: PromiseLike<unknown>[] = [];

  const ausenciasAntes = new Map((antes?.ausencias ?? []).map((a) => [a.id, a]));
  const ausenciasQuitadas = [...ausenciasAntes.keys()].filter((id) => !ahora.ausencias.some((a) => a.id === id));
  if (ausenciasQuitadas.length > 0) tareas.push(tx`delete from ausencias where id = any(${ausenciasQuitadas}::text[])`);
  for (const a of ahora.ausencias) {
    if (igual(ausenciasAntes.get(a.id), a)) continue;
    tareas.push(tx`
      insert into ausencias (id, colaborador, oficina_id, tipo, desde, hasta)
      values (${a.id}, ${a.colaborador}, ${a.oficinaId}, ${a.tipo}, ${a.desde}, ${a.hasta})
      on conflict (id) do update
        set colaborador = excluded.colaborador, oficina_id = excluded.oficina_id, tipo = excluded.tipo,
            desde = excluded.desde, hasta = excluded.hasta`);
  }

  const sugerenciasAntes = new Map((antes?.sugerencias ?? []).map((s) => [s.id, s]));
  const sugerenciasQuitadas = [...sugerenciasAntes.keys()].filter((id) => !ahora.sugerencias.some((s) => s.id === id));
  if (sugerenciasQuitadas.length > 0) tareas.push(tx`delete from sugerencias where id = any(${sugerenciasQuitadas}::text[])`);
  for (const s of ahora.sugerencias) {
    if (igual(sugerenciasAntes.get(s.id), s)) continue;
    tareas.push(tx`
      insert into sugerencias (id, origen_id, destino_id, personas, modalidad, franjas, estado)
      values (${s.id}, ${s.origenId}, ${s.destinoId}, ${s.personas}, ${s.modalidad}, ${s.franjas}::text[], ${s.estado})
      on conflict (id) do update
        set origen_id = excluded.origen_id, destino_id = excluded.destino_id, personas = excluded.personas,
            modalidad = excluded.modalidad, franjas = excluded.franjas, estado = excluded.estado`);
  }

  await Promise.all(tareas);
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

/** Aplica un cambio al estado y lo guarda; `cambio` modifica `e` directamente. */
export async function escribirEstado(cambio: (e: Estado) => void): Promise<void> {
  const sql = conexion();
  if (!sql) {
    cambio(await leerEstado());
    return;
  }
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(7001)`; // una persona a la vez
    const guardado = await cargar(tx); // null si la base está vacía: entonces se escribe todo
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