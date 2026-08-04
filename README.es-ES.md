# eggroll-pos

Un sistema de pedidos y punto de venta (POS) de restaurante autoalojado y gratuito, junto con funcionalidad de pedidos en línea. Los márgenes de los restaurantes ya son ajustados, ¡eggroll-pos te brinda una solución completa de pedidos y gestión de cocina sin pagar nada a plataformas de SaaS. Autohospétalo, controla tus datos de clientes y marca tu negocio como veas fit.

## Características

- **Panel de Control del Comerciante** — Acepta, prepara y cumple pedidos entrantes en tiempo real
- **Menú en Línea y Pedidos** — Los clientes navegan por el menú y realizan pedidos desde una vista web
- **Sistema de Recibos** — Recibos generados automáticamente con partidas, impuestos y totales
- **Formulario de Contacto/Programa de Leads** — Captura leads para inscripción beta

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 16, React Router v5, React Bootstrap |
| Backend | Express.js 4 (Node.js) |
| Base de Datos | PostgreSQL o SQLite con Knex.js |
| Herramienta de Build | Vite 7 con TypeScript |
| Herramientas de Desarrollo | tsx, nodemon, concurrently |

## Requisitos Previos

- **Node.js** >= 22.14.0
- **pnpm** (fijado a 10.17.0 mediante el campo `packageManager`)
- **Docker** (opcional — necesario para el modo PostgreSQL)

## Admin: Crear Cuentas de Comerciante

Las cuentas de comerciante **solo** pueden ser creadas mediante el script de admin — no a través de UI ni API:

```bash
pnpm run create-merchant "Nombre del Negocio" [--address "123 Calle Principal"] [--postal-code 94105] [--description "descripcion"] [--type cafe]
```

El script genera el UUID del nuevo comerciante y la URL del panel de control.

##Inicio Rápido

Un comando inicia todo — base de datos, migraciones, seeds y ambos servidores de desarrollo:

```bash
git clone <repo-url>
cd eggroll-pos
pnpm install
./dev.sh              # PostgreSQL vía Docker (por defecto)
./dev.sh --sqlite     # SQLite, sin Docker necesario
```

Eso es todo. Abre [http://localhost:3001](http://localhost:3001) en tu navegador.

Si Docker no está instalado, el script cae automáticamente en SQLite.

El script:
1. Inicia la base de datos (PostgreSQL Docker o archivo SQLite local en `db/eggrollpos.db`)
2. Ejecuta migraciones y datos semilla
3. Inicia el servidor API Express (puerto 3000)
4. Inicia el servidor Vite con HMR (puerto 3001)

Presiona `Ctrl+C` para detener los servidores de desarrollo. Si usas Docker, PostgreSQL sigue ejecutándose — deténlo con `docker compose down`.

## Configuración Manual (sin dev.sh)

Si prefieres ejecutar las cosas por separado:

### 1. Iniciar la base de datos

**Opción A — PostgreSQL vía Docker:**

```bash
docker compose up -d
```

| Configuración | Valor |
|---------|-------|
| Host | `127.0.0.1:5432` |
| Base de Datos | `eggrollpos` |
| Usuario / Contraseña | `postgres` / `postgres` |

Sobrescribe con variables de entorno: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.

**Opción B — SQLite (sin Docker):**

```bash
export DB_CLIENT=sqlite3
```

Esto crea automáticamente `db/eggrollpos.db`. No se necesita un servidor de base de datos separado.

### 2. Ejecutar migraciones y seeds

```bash
npx knex migrate:latest --knexfile db/knexfile.js
npx knex seed:run --knexfile db/knexfile.js
```

### 3. Iniciar los servidores de desarrollo

| Servidor | Puerto | Propósito |
|--------|------|---------|
| API Express | 3000 | API REST, vistas SSR |
| Servidor Vite | 3001 | Frontend React con HMR |

```bash
# Terminal 1: Backend Express
NODE_ENV=development npx tsx ./bin/www

# Terminal 2: Frontend Vite
npx vite
```

> **¿Por qué `tsx`?** El JavaScript del lado del servidor usa `require()` para importar módulos TypeScript compartidos desde `src/shared/`. Plain `node` no puede resolver extensiones `.ts` para llamadas `require` CJS, por lo que `tsx` es necesario para cerrar esta brecha.

Abre [http://localhost:3001](http://localhost:3001) en tu navegador.

### 5. Explorar la aplicación

| URL | Página |
|-----|------|
| `/` | Página principal con formulario de inscripción beta |
| `/about` | Página acerca de |
| `/merchant/:uuid` | Panel POS del comerciante (UUID identifica al comerciante) |
| `/order-online/:merchantId` | Menú público de pedidos para un comerciante específico |
| `/orders/:orderUuid/menus` | Vista de pedidos de menú para un pedido existente |
| `/receipts/:uuid` | Vista del recibo (UUID del pedido) |

UUIDs semilla de comerciante para desarrollo local:

| Comerciante | UUID | URL del Panel |
|----------|------|---------------|
| Alice Merchant 1 | `mc000001-0001-0001-0001-000000000001` | `/merchant/mc000001-0001-0001-0001-000000000001` |
| Alice Merchant 2 | `mc000002-0002-0002-0002-000000000002` | `/merchant/mc000002-0002-0002-0002-000000000002` |
| Alice Merchant 3 | `mc000003-0003-0003-0003-000000000003` | `/merchant/mc000003-0003-0003-0003-000000000003` |

## Scripts Disponibles

```bash
pnpm run dev          # Iniciar Vite + Express concurrentmente
pnpm run build        # Build de producción (Vite)
pnpm run build:server # Compilar TypeScript del lado del servidor
pnpm run build:all    # Build de cliente y servidor
pnpm run type-check   # Verificación de tipos TypeScript (tiene errores preexistentes)
pnpm run preview      # Previsualizar build de producción localmente
pnpm test             # Ejecutar pruebas mocha
```

## Estructura del Proyecto

```
├── dev.sh                   # Script de lanzamiento de desarrollo de un comando
├── docker-compose.yml       # Configuración PostgreSQL Docker
├── bin/www                  # Punto de entrada del servidor HTTP Express
├── index.html               # HTML de entrada Vite (desarrollo)
├── db/
│   ├── knexfile.js          # Configuración de conexión de base de datos
│   ├── knex.js              # Instancia Knex
│   ├── migrations/          # Migraciones de esquema de base de datos
│   └── seeds/               # Datos semilla de desarrollo
├── src/
│   ├── client/              # Frontend React (TypeScript)
│   │   ├── js/
│   │   │   ├── index.tsx    # Punto de entrada React
│   │   │   ├── App.tsx      # Router y layout de página
│   │   │   ├── api/         # Funciones cliente API
│   │   │   ├── components/  # Componentes reutilizables (ContactForm, Spinner, Lazy)
│   │   │   └── pages/       # Componentes de página (HomeLanding, MerchantRoutes, Menus, Receipts)
│   │   ├── css/             # Hojas de estilo
│   │   └── assets/          # Imágenes estáticas
│   ├── server/              # Backend Express (JavaScript)
│   │   ├── index.js         # Configuración de app Express y rutas
│   │   ├── constants.js     # Constantes de la app (tasas de impuesto, config)
│   │   ├── routes/          # Manejadores de rutas API
│   │   ├── models/          # Modelos de base de datos (Orders, Customers, Merchants, etc.)
│   │   ├── services/        # Lógica de negocio (Actions)
│   │   └── views/           # Plantillas EJS (fallback SSR)
│   ├── shared/              # Módulos TypeScript compartidos (estados de pedido, tipos de pago)
│   └── types/               # Definiciones globales de tipos TypeScript
├── specs/                   # Especificaciones de pruebas Mocha
├── vite.config.ts           # Configuración Vite
├── tsconfig.json            # Configuración TypeScript (cliente)
└── tsconfig.server.json     # Configuración TypeScript (servidor)
```

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto para integraciones opcionales:

```env
# Server
PORT=3000
NODE_ENV=development

# PostgreSQL (valores por defecto dev funcionan con docker-compose.yml)
DB_HOST=127.0.0.1
DB_NAME=eggrollpos
DB_USER=postgres
DB_PASSWORD=postgres

# PostgreSQL (producción — sobrescribe lo anterior)
DATABASE_URL=postgres://user:pass@host:5432/eggrollpos
```

## Endpoints de la API

Ver [docs/routes.md](docs/routes.md) para la referencia completa de la API, incluyendo esquemas de solicitud/respuesta y rutas cliente.

## Migraciones de Base de Datos

```bash
# Ejecutar todas las migraciones pendientes
npx knex migrate:latest --knexfile db/knexfile.js

# Revertir el último lote
npx knex migrate:rollback --knexfile db/knexfile.js

# Ejecutar seeds (datos semilla de desarrollo)
npx knex seed:run --knexfile db/knexfile.js
```

## Build de Producción

```bash
pnpm run build        # Builds assets del cliente a dist/
pnpm run start        # Inicia Express en modo producción (usa tsx)
```

En producción, el servidor Express sirve los assets estáticos construidos desde `/dist`.

## Implementación

Ver **[DEPLOY.md](DEPLOY.md)** para instrucciones de Docker, Railway, Render, Fly.io e Implementación con Docker Compose autoalojado.

## Licencia

Código abierto — gratuito para restaurantes que lo autoalojen y personalicen.
