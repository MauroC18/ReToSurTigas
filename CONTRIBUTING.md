# Guía de Contribución y Colaboración

¡Bienvenidos al repositorio de **ReToSurTigas**! Para mantener un desarrollo ordenado y limpio en equipo, seguimos estas pautas de trabajo:

## 1. Estrategia de Ramas
- **`main`**: Rama de producción y versiones estables. Nunca se empuja código directamente a `main`.
- **`develop`**: Rama base para el desarrollo diario e integración de código entre compañeros.
- **Ramas de trabajo**: Se desprenden siempre desde la versión más reciente de `develop`:
  - `feature/nombre-de-la-funcionalidad` para nuevas características.
  - `fix/descripcion-del-bug` para arreglos de bugs.
  - `docs/tema-a-documentar` para documentación y guías.

### Flujo de trabajo estándar:
1. Sincronizar `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. Crear rama:
   ```bash
   git checkout -b feature/nombre-de-la-tarea
   ```
3. Trabajar y realizar commits semánticos.
4. Subir la rama a GitHub y crear un **Pull Request hacia `develop`**.
5. Revisión y aprobación del compañero de equipo.
6. Fusión mediante **Squash and Merge** y eliminación de la rama secundaria en GitHub y local.
7. `develop` pasa a `main` con un PR únicamente para entregas estables.

## 2. Convención de Commits (Conventional Commits)
Escribe los mensajes de commit en español con el formato: `tipo(alcance): descripción breve en presente`.
Ejemplos:
- `feat(ui): agregar selector de fecha en módulo de ausencia`
- `fix(lib): corregir cálculo de Erlang-C para asesores fraccionados`
- `docs(readme): actualizar instrucciones de despliegue`
- `chore(deps): actualizar versión de dependencias`

## 3. Reglas de Código y Arquitectura
- **Desacoplamiento**: Todas las pantallas en `app/` y componentes en `components/` deben consultar datos y cálculos exclusivamente a través de `lib/api.ts`.
- **Validación previa**: Antes de abrir un PR o hacer push, valida:
  ```bash
  npm run lint
  npx tsc --noEmit
  npm run build
  ```

## 4. Política de Privacidad de Datos
- **Estricta confidencialidad**: Bajo ninguna circunstancia se debe subir el archivo `Historicos_Turnos_MAY2026.xlsx`, archivos `*.csv`, `*.pkl` ni información que identifique personas reales.
