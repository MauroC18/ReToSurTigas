# Documentación técnica

Complementa el [README](../README.md) de la raíz. Aquí van la arquitectura, las reglas del código y las decisiones, para que cualquiera del equipo sepa qué hay antes de agregar algo.

## 1. Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript en modo estricto.
- Estilos con CSS propio (`app/globals.css`) y variables; la fuente es Figtree (`next/font`).
- Formularios con Server Actions (`lib/actions.ts`).
- Datos en memoria (`lib/store.ts`). Postgres y servicios aparte quedan para después.

## 2. Estructura

- `app/`: una carpeta por pantalla (`panel`, `malla`, `alertas`, `que-pasa-si`, `ausencia`, `datos`) y `malla/exportar` (CSV).
- `components/`: piezas reutilizables y formularios (`simulador`, `formausencia`, `formmeta`, `configavisos`, `subidadatos`, `sidebar`, `ui`).
- `lib/`: la lógica. Ver sección 4.

Los nombres de archivos de componentes van en minúscula y las importaciones deben coincidir exactamente (en Windows no se nota, en Linux y en el CI sí).

## 3. Reglas

1. Las pantallas y los componentes solo leen y escriben datos con `lib/api.ts`: `obtenerEstado`, `decidirSugerencia`, `registrarAusencia`, `actualizarMeta`.
2. Los formularios llaman a las acciones de `lib/actions.ts`, que ejecutan `api.ts` y después `revalidatePath("/", "layout")`.
3. Los cálculos viven en `lib/` y no dentro de las pantallas.
4. El layout usa `export const dynamic = "force-dynamic"`. Eso exige que `cacheComponents` esté desactivado en `next.config.ts`.
5. No se suben archivos del histórico de Surtigas (`*.xlsx`, `*.csv`) ni `.env`.
6. Antes de cada commit: `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## 4. Cómo se calcula

| Archivo | Qué hace |
|---|---|
| `datos.ts` | Oficinas con sus llegadas por hora (7 a 16), minutos por visita y personas; franjas; factor por hora; eficiencia |
| `colas.ts` | Espera por hora con fila heredada y personas necesarias por hora |
| `erlang.ts` | Erlang C (`esperaMin`, `necesarios`) y `formatoEspera` |
| `analisis.ts` | Esperas y diferencias por franja, resúmenes, simulador y apoyos aprobados |
| `motor.ts` | Propone sugerencias de apoyo virtual por franja |
| `api.ts` | Puerta de entrada a los datos; recalcula sugerencias al cambiar la meta o registrar una ausencia |

Fórmulas del modelo de colas:

- Capacidad de una hora = (60 / minutos por visita) × personas × factor de la hora × 0,85.
- Fila al final de la hora = máx(0, fila anterior + llegadas − capacidad).
- Espera de la hora = ((fila inicial + fila final) / 2) / capacidad × 60.

Una franja usa la peor hora que contiene. "Falta" y "Sobra" comparan las personas con las necesarias para cumplir la meta.

## 5. Datos de ejemplo

- 14 oficinas reales de Surtigas con promedios por día hábil de mayo de 2026, agregados y redondeados. Sin nombres ni contratos.
- Personas por oficina: las que atienden a la vez en un día típico (31 en total). El reto habla de 36 colaboradores; hay que confirmar la diferencia.
- Tres ausencias de ejemplo con nombres inventados (Cartagena, Montería, Sincelejo).
- Fecha de ejemplo: 16 de octubre de 2026. Meta inicial: 30 minutos.

## 6. Pantallas

| Ruta | Qué muestra | Responsable |
|---|---|---|
| `/panel` | Resumen del día, oficinas fuera de la meta y sugerencias | Por definir |
| `/malla` | Falta/Sobra por franja, apoyos aprobados, exportar CSV | Por definir |
| `/alertas` | Sugerencias para aprobar, rechazar o deshacer | Por definir |
| `/que-pasa-si` | Simulador de movimientos por franja | Por definir |
| `/ausencia` | Registro de ausencias | Por definir |
| `/datos` | Meta de espera y resumen de datos | Por definir |

## 7. Qué está hecho

- Las seis pantallas con datos reales agregados.
- Modelo de colas con fila heredada y comparación con Erlang C.
- Motor de sugerencias, aprobación y reflejo en Malla y Panel.
- Simulador por franja.
- Exportar la Malla a CSV.
- Ausencias que descuentan personal y recalculan sugerencias.

## 8. Pendiente

- Conexión con Digiturno y carga de datos desde archivo (`subidadatos` hoy no importa nada).
- Postgres y `.env.example`.
- Avisos por WhatsApp o correo (`configavisos` es solo una vista de ejemplo).
- "Enviar a aprobación" del simulador es un enlace a Alertas, no crea la sugerencia.
- Horarios reales del personal y tiempo de traslado entre oficinas.
- Pruebas automáticas (por ahora solo se revisó el cálculo a mano).

## 9. Límites del modelo

- Calibrado y medido con un solo mes: correlación de 0,86 entre la espera estimada y la real a nivel de oficina, error medio de unos 11 minutos, y tiende a subestimar en las oficinas pequeñas.
- Con el personal actual la meta de 10 minutos no se alcanza en horas pico; por eso la meta inicial es 30.
- Reasignar entre oficinas ayuda poco: los faltantes están en la mañana y casi ninguna oficina tiene holgura a esa hora.
- Se necesita validar con más meses y con los horarios reales.

## 10. Decisiones tomadas

- Un solo proyecto Next.js, sin monorepo ni Docker.
- Next.js con App Router y no una SPA, para poder agregar APIs y servidor después.
- Fila con arrastre en lugar de Erlang C por hora: Erlang C por hora aislado casi no explica las esperas reales.
- El apoyo propuesto es virtual y por franja, porque hay poca holgura y no se conoce el tiempo de traslado.
- Solo las sugerencias aprobadas cambian la Malla.
- Datos del histórico solo como promedios agregados dentro del código.

## 11. Decisiones por tomar

- Meta de espera que usará Surtigas.
- Cómo se importan los datos de Digiturno (archivo, base de datos o servicio).
- Quién aprueba las sugerencias y cómo se avisa a las personas.
- Si el apoyo presencial se incluye y con qué tiempo de traslado.
