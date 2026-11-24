# Más allá del turno · Surtigas

Prototipo para automatizar la gestión de turnos y la redistribución de personal en las 14 oficinas de atención de Surtigas. Toma la demanda por hora (histórico de Digiturno), las ausencias y una meta de espera, y propone qué oficinas necesitan apoyo y cuáles pueden darlo. Una persona aprueba o rechaza cada sugerencia.

> Es un prototipo con datos agregados de mayo de 2026 y un estado en memoria. No está conectado todavía a Digiturno ni a una base de datos.

## Cómo correrlo

Requisitos: Node.js 20 o superior y npm.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # compila para producción
npm run lint     # revisa el código
npx tsc --noEmit # revisa los tipos
```

Los cambios que hagas en la app (ausencias, decisiones, meta) viven en la memoria del servidor: se pierden al reiniciarlo.

## Pantallas

| Ruta | Qué hace |
|---|---|
| `/panel` | Resumen del día: oficinas fuera de la meta, espera más larga y sugerencias |
| `/malla` | Faltantes y sobrantes por oficina y franja, con los apoyos aprobados. Exporta a CSV |
| `/alertas` | Sugerencias del motor para aprobar, rechazar o deshacer |
| `/que-pasa-si` | Simula mover personas entre oficinas en las franjas que se elijan |
| `/ausencia` | Registra una ausencia; descuenta a la persona y recalcula las sugerencias |
| `/datos` | Meta de espera y resumen de los datos de ejemplo |

## Cómo calcula

1. **Demanda:** llegadas promedio por hora y duración de la visita, por oficina (histórico de mayo de 2026).
2. **Fila con arrastre (`lib/colas.ts`):** la fila de una hora se hereda a la siguiente. Capacidad por hora = (60 / minutos por visita) × personas × factor de la hora × eficiencia (0,85). Espera = fila promedio de la hora / capacidad.
3. **Personas necesarias:** las que mantienen la espera por debajo de la meta en cada franja.
4. **Motor de sugerencias (`lib/motor.ts`):** para cada franja, pone una persona de apoyo virtual de la oficina con holgura en la oficina con déficit. Solo deja las sugerencias que mejoran al destino y no dejan al origen fuera de la meta.
5. **Apoyos aprobados:** solo las sugerencias aprobadas cambian la Malla y el Panel.

### Límites del modelo (leer antes de presentarlo)

- Se calibró y se midió con un solo mes (mayo de 2026), sin datos separados para validar. Con ese mes, la correlación a nivel de oficina fue de 0,86 con un error medio de unos 11 minutos, y tiende a subestimar la espera en las oficinas pequeñas.
- El cálculo por hora aislado (Erlang C) no sirvió: no explicaba las esperas reales porque ignora la fila heredada. Por eso se usa el modelo con arrastre.
- Con el personal actual, la meta de 10 minutos no se alcanza en horas pico. Por eso la meta inicial es 30 minutos y es editable en `/datos`.
- Reasignar entre oficinas ayuda poco: los faltantes están en la mañana y casi ninguna oficina tiene holgura a esa hora. Se necesita más personal en horas pico.
- El reto menciona 36 colaboradores; el histórico muestra unos 31 atendiendo a la vez. Hay que confirmarlo con Surtigas.
- Faltan los horarios reales del personal, el tiempo de traslado entre oficinas (solo se sugiere apoyo virtual) y más meses de datos.

## Estructura

```
app/            pantallas (Next.js App Router) y /malla/exportar (CSV)
components/     piezas de interfaz
lib/
  api.ts        única puerta de entrada a los datos para las pantallas
  actions.ts    acciones de servidor (formularios)
  store.ts      estado en memoria (se cambiará por Postgres)
  datos.ts      oficinas, franjas y constantes del modelo
  colas.ts      fila con arrastre y personas necesarias por hora
  analisis.ts   cálculos para las pantallas
  motor.ts      motor de sugerencias
  erlang.ts     fórmulas de Erlang C y formato de esperas
  tipos.ts      tipos compartidos
docs/           documentación de arquitectura y decisiones
```

**Regla de arquitectura:** las pantallas y los componentes solo leen y escriben datos a través de `lib/api.ts`. Así, cuando entre Postgres, solo cambian `api.ts` y `store.ts`.

## Cómo trabajamos

- `main`: versión estable. No se hace commit directo.
- `develop`: rama de integración.
- `feature/…`, `fix/…`, `docs/…`: una rama por tarea, desde `develop`, con Pull Request hacia `develop` y revisión del compañero.
- Commits en español con Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
- Antes de cada commit: `npx tsc --noEmit`, `npm run lint` y `npm run build`.

Más detalle en [CONTRIBUTING.md](CONTRIBUTING.md) y en [docs/README.md](docs/README.md).

## Privacidad de los datos

El histórico original de Digiturno es privado y **no está en este repositorio** ni debe subirse (`*.xlsx`, `*.csv` y `.env*` están en `.gitignore`). Todo lo que hay en `lib/datos.ts` son promedios agregados y redondeados, sin nombres, contratos ni registros individuales. Los nombres de colaboradores de ejemplo son inventados.

## Pendiente

- Conexión a Digiturno y carga de datos desde archivo.
- Persistencia con Postgres y `.env.example` con las variables.
- Horarios reales del personal y tiempo de traslado entre oficinas.
- Avisos por WhatsApp o correo (hoy son solo una vista de ejemplo).
- Confirmar con Surtigas el total de colaboradores y la explicación de las cancelaciones en el histórico.
