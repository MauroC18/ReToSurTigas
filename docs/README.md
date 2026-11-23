# Arquitectura y Decisiones de Diseño

Este documento describe las bases técnicas y de negocio del proyecto de optimización de turnos para Surtigas.

## 1. Arquitectura General
El proyecto está construido sobre Next.js 16 con App Router y TypeScript:
- **Capa de Presentación (`app/`, `components/`)**: Interfaces reactivas para visualización de KPIs, mallas de turnos, gestión de ausencias y simulador "¿Qué pasa si?".
- **Capa de Abstracción (`lib/api.ts`)**: Fachada única para desacoplar las vistas de la lógica de persistencia y simulación.
- **Capa de Negocio y Modelado (`lib/`)**:
  - `colas.ts` y `erlang.ts`: Modelos de teoría de colas (M/M/c y Erlang-C) para estimar tiempos de espera, ocupación de asesores y probabilidades de demora.
  - `analisis.ts`: Procesamiento de métricas y niveles de servicio (SLA).
  - `datos.ts`: Configuración y datos consolidados de las oficinas de Surtigas (Cartagena, Barranquilla, etc.).
  - `store.ts` y `actions.ts`: Manejo de estado y operaciones de la aplicación.

## 2. Decisiones de Diseño
- **Principio de responsabilidad única**: Las páginas consumen exclusivamente métodos definidos en `lib/api.ts`.
- **Privacidad y cumplimiento**: Todos los datos cargados en el código son promedios agregados y anónimos. Los insumos crudos están protegidos en `.gitignore`.
- **Evolución**: En etapas futuras, `lib/api.ts` se conectará a PostgreSQL sin necesidad de alterar los componentes de la interfaz.
