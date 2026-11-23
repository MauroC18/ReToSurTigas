# ReToSurTigas - Sistema de Optimización y Gestión de Turnos

Sistema inteligente para la predicción, dimensionamiento y gestión de turnos de atención al cliente en sedes de Surtigas.
Permite analizar la demanda histórica, simular colas de espera con modelos matemáticos (Erlang-C), calcular dotaciones óptimas de asesores y evaluar escenarios de contingencia en tiempo real.

## Requisitos e Instalación

- **Node.js**: >= 18.x
- **Gestor de paquetes**: npm (o yarn/pnpm)

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo local
npm run dev

# Verificar tipos y reglas de estilo
npx tsc --noEmit
npm run lint

# Generar compilación para producción
npm run build
```

## Estructura de Carpetas

```text
surtigas-turno/
├── app/          # Rutas y páginas de la aplicación (Next.js App Router)
├── components/   # Componentes de interfaz de usuario reutilizables
├── lib/          # Lógica de negocio, modelos matemáticos (colas/Erlang) y datos
├── docs/         # Documentación de arquitectura y decisiones de diseño
├── public/       # Recursos estáticos
└── .github/      # Plantillas y flujos de integración continua
```

> **Regla de arquitectura**: Las pantallas y componentes de la UI solo deben consumir la lógica de negocio y datos a través de `lib/api.ts`. No acceder a fuentes o cálculos internos directamente desde las vistas.

Para mayor detalle de la arquitectura, decisiones de modelado y diseño, consulta [docs/README.md](docs/README.md).

## Flujo de Trabajo y Colaboración (Git)

1. **Actualizar la base**:
   ```bash
   git checkout develop && git pull origin develop
   ```
2. **Crear rama de trabajo**:
   ```bash
   git checkout -b feature/nombre-tarea
   # También ramas fix/nombre-arreglo o docs/nombre-documento
   ```
3. **Commits semánticos** (Conventional Commits en español):
   - `feat(...)`, `fix(...)`, `docs(...)`, `chore(...)`, `refactor(...)`
4. **Subir rama y abrir Pull Request**:
   Subir los cambios a GitHub y crear un Pull Request hacia la rama `develop`.
5. **Revisión por pares**:
   El compañero revisa el código, se resuelven comentarios y se fusiona mediante **Squash and Merge**. Posteriormente se elimina la rama secundaria.
6. **Paso a producción**:
   `develop` se fusiona hacia `main` únicamente mediante PR para entregas y versiones estables.

## Aviso de Privacidad y Seguridad

- **Archivos confidenciales**: No se deben subir bajo ninguna circunstancia archivos del histórico de Surtigas (`*.xlsx`, `*.xls`, `*.csv`, `*.pkl`) ni datos personales sensibles de clientes o asesores.
- Los datasets incorporados en el código corresponden a promedios consolidados y anónimos.

## Pendientes

- [ ] Generar `.env.example` y configurar variables de entorno una vez se integre la base de datos PostgreSQL.
