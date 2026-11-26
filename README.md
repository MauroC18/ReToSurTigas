# Más allá del turno · Surtigas

Sistema inteligente para la predicción, dimensionamiento y optimización de turnos de atención al cliente en las 14 oficinas presenciales de **Surtigas**.

A partir del análisis de demanda por hora (histórico de Digiturno), registro de ausencias y metas de nivel de servicio (SLA), el sistema calcula la dotación requerida, modela las colas de espera con arrastre horario y propone redistribuciones dinámicas de asesores entre sedes para evitar cuellos de botella. Cada sugerencia es validada y autorizada por el coordinador de turno.

---

## Características Principales

- **Panel de Control en Tiempo Real (`/panel`)**: KPIs críticos del día, sedes fuera de meta de espera, franjas críticas, sugerencias pendientes y gráfica interactiva de llegadas por sede.
- **Malla Operativa y Exportación (`/malla`)**: Balance horario de personal (sobrantes y faltantes) para las 14 sedes, integración de apoyos aprobados y exportación a archivo CSV (`/malla/exportar`).
- **Gestión de Alertas y Sugerencias (`/alertas`)**: Centro de aprobación y rechazo de traslados recomendados por el motor matemático.
- **Simulador "¿Qué pasa si?" (`/que-pasa-si`)**: Modelado interactivo de contingencias y traslados manuales de personal entre oficinas con cálculo instantáneo de impacto en tiempos de espera.
- **Control de Ausencias (`/ausencia`)**: Registro inmediato de licencias, incapacidades o permisos con recálculo automático de capacidad y sugerencias de apoyo.
- **Gestión de Datos y Calibración (`/datos`)**: Ajuste dinámico de la meta de espera (SLA), carga de archivos CSV de Digiturno y función de restablecimiento a datos base de ejemplo.
- **Persistencia Dual (PostgreSQL / Memoria)**: Conectado a **Supabase (PostgreSQL)** con pool de conexiones y bloqueos transaccionales (*advisory locks*); con respaldo transparente en memoria local si no hay base de datos configurada.

---

## Arquitectura Tecnológica

- **Frontend & Backend**: Next.js 16 (App Router, Server Components y Server Actions con Turbopack).
- **Lenguaje**: TypeScript en modo estricto.
- **Base de Datos**: PostgreSQL alojado en **Supabase** (usando el driver `postgres` nativo con `serverExternalPackages`).
- **Estilos**: Tailwind CSS 4.
- **Control de Calidad e Integración**: ESLint, TypeScript Typecheck y GitHub Actions CI.
- **Despliegue**: Optimizado para **Vercel**.

```text
surtigas-turno/
├── app/                  # Rutas y páginas de la aplicación (App Router)
│   ├── panel/            # Tablero principal de mando
│   ├── malla/            # Malla horaria de personal y ruta /malla/exportar (CSV)
│   ├── alertas/          # Aprobación de sugerencias
│   ├── que-pasa-si/      # Simulador de contingencias
│   ├── ausencia/         # Registro de ausencias
│   └── datos/            # Configuración SLA, carga de CSV y reset
├── components/           # Componentes modulares de interfaz de usuario
├── db/                   # Scripts DDL de base de datos (schema.sql, reiniciar.sql)
├── lib/                  # Lógica de negocio y modelos de datos
│   ├── api.ts            # Fachada pública consumida por las vistas
│   ├── store.ts          # Persistencia atómica en PostgreSQL / fallback en memoria
│   ├── colas.ts          # Modelo de teoría de colas con arrastre entre franjas
│   ├── erlang.ts         # Fórmulas de Erlang-C y formato de tiempos de espera
│   ├── motor.ts          # Algoritmo de sugerencias automáticas de apoyo
│   ├── importar.ts       # Parser y agregador de turnos desde CSV de Digiturno
│   ├── analisis.ts       # Cálculos estadísticos y agrupaciones
│   └── datos.ts          # Parámetros consolidados de las 14 sedes de Surtigas
├── docs/                 # Documentación técnica de arquitectura y decisiones
└── .github/              # Configuración de GitHub Actions (ci.yml)
```

> **Regla de Arquitectura**: Las pantallas (`app/`) y componentes (`components/`) consumen la lógica del sistema exclusivamente a través de la fachada en `lib/api.ts`. Nunca acceden directamente a la base de datos o almacenamiento interno.

---

## Requisitos e Instalación

### Requisitos previos
- **Node.js**: Versión 20.x o superior.
- **npm**: Versión 10.x o superior.

### Instalación local

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/josephcharris/ReToSurTigas.git
   cd ReToSurTigas
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno (Opcional para modo local):
   Crea un archivo `.env` en la raíz del proyecto para conectar Supabase:
   ```env
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   *(Si omites `.env`, el sistema opera automáticamente con el estado en memoria RAM con datos de ejemplo).*

4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

5. Comprobaciones de calidad:
   ```bash
   npx tsc --noEmit   # Comprobación de tipos
   npm run lint       # Análisis estático de código
   npm run build      # Compilación de producción
   ```

---

## Modelo Matemático y Motor de Decisión

1. **Demanda Horaria**: Se procesan las llegadas promedio de clientes por oficina para cada una de las 8 franjas horarias del día (8:00 a. m. a 4:00 p. m.) junto con los tiempos medios de atención ($T_{\text{servicio}}$).
2. **Modelo de Colas con Arrastre (`lib/colas.ts`)**:
   - A diferencia de Erlang-C tradicional (que asume que cada hora inicia en cero), este sistema traslada la fila residual de clientes no atendidos de una hora a la franja siguiente.
   - $\text{Capacidad Horaria} = \left(\frac{60}{T_{\text{servicio}}}\right) \times \text{Asesores} \times \text{Factor de franja} \times \text{Eficiencia (0.85)}$.
   - $\text{Espera estimada} = \frac{\text{Fila promedio acumulada}}{\text{Capacidad}}$.
3. **Cálculo de Dotación Óptima**: Determina el número mínimo de asesores requeridos por franja para mantener el tiempo de espera por debajo de la meta de SLA (por defecto 30 minutos, ajustable en `/datos`).
4. **Motor de Apoyos Virtuales (`lib/motor.ts`)**:
   - Identifica simultáneamente oficinas con déficit crítico y oficinas con holgura de asesores.
   - Evalúa candidatos de apoyo bajo modalidad virtual (sin tiempo muerto de desplazamiento).
   - Genera la recomendación únicamente si el destino mejora sustancialmente su tiempo de espera sin que la sede de origen caiga fuera de la meta.

---

## Despliegue en Vercel

El proyecto está listo para producción en Vercel sin necesidad de `vercel.json`:

1. Importa el repositorio desde el panel de **Vercel**.
2. **Framework Preset**: Detectará automáticamente `Next.js`.
3. **Variables de Entorno**:
   - Agrega `DATABASE_URL` con tu cadena de conexión a Supabase (Transaction Pooler).
   - Márcala para los 3 entornos: *Production*, *Preview* y *Development*.
4. **Región de Serverless Functions**:
   - En Vercel: **Settings → Functions → Function Region**.
   - Selecciona la misma región de AWS en la que creaste tu base de datos en Supabase para reducir la latencia de conexión.
5. Haz clic en **Deploy**.

---

## Flujo de Trabajo y Buenas Prácticas (Git)

- **`main`**: Rama de producción y versiones estables protegida. Solo recibe merges probados desde `develop`.
- **`develop`**: Rama base de integración activa del equipo.
- **Ramas de trabajo**: Se crean desde `develop` con nomenclatura `feature/nombre-tarea`, `fix/nombre-bug` o `docs/tema`.
- **Commits**: Formato *Conventional Commits* en español (`feat:`, `fix:`, `docs:`, `chore:`).
- **Integración Continua (CI)**: Cada Pull Request o push hacia `main` o `develop` ejecuta automáticamente comprobación de tipos, linting y build en GitHub Actions.

Para conocer más detalles del flujo colaborativo, consulta [CONTRIBUTING.md](CONTRIBUTING.md) y [docs/README.md](docs/README.md).

---

## Seguridad y Privacidad de los Datos

> [!IMPORTANT]
> - El archivo histórico original de Digiturno (`Historicos_Turnos_MAY2026.xlsx`), datasets crudos (`*.xlsx`, `*.csv`, `*.pkl`) y credenciales (`.env*`) están estrictamente ignorados por Git y **nunca deben subirse al repositorio**.
> - La base de datos y el archivo `lib/datos.ts` manejan únicamente promedios consolidados y anónimos, sin registros transaccionales ni datos personales sensibles de usuarios o colaboradores.

---

## Versiones Publicadas

- **`v1.0.0-entrega`**: Versión base con motor de sugerencias, malla con fila heredada y exportación a CSV.
- **`v1.1.0`**: Integración con PostgreSQL (Supabase), restablecimiento de datos y optimización de conexiones.
