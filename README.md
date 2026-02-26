# eggroll-pos

A free, self-hosted restaurant POS (Point-of-Sale) and online ordering system. Restaurant margins are slim enough already — eggroll-pos gives you a complete ordering and kitchen management solution without paying a dime to SaaS platforms. Self-host it, own your customer data, and market however you see fit.

## Features

- **Merchant Dashboard** — Accept, prepare, and fulfill incoming orders in real time
- **Online Menu & Ordering** — Customers browse menus and place orders from a web view
- **Receipt System** — Auto-generated receipts with line items, tax, and totals
- **Facebook Messenger Chatbot** — Take orders through Messenger (optional)
- **Contact/Lead Form** — Capture beta signup leads via Airtable (optional)
- **Nearby Restaurant Search** — Zomato API integration (optional)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 16, React Router v5, React Bootstrap |
| Backend | Express.js 4 (Node.js) |
| Database | PostgreSQL with Knex.js query builder |
| Build Tool | Vite 7 with TypeScript |
| Dev Tools | tsx, nodemon, concurrently |

## Prerequisites

- **Node.js** >= 22.14.0
- **pnpm** (pinned to 10.17.0 via `packageManager` field)
- **PostgreSQL** running locally

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd eggroll-pos
pnpm install
```

### 2. Set up PostgreSQL

Create the database:

```bash
createdb eggrollpos
```

The default connection settings (in `db/knexfile.js`) are:

| Setting | Value |
|---------|-------|
| Host | `127.0.0.1` |
| Database | `eggrollpos` |
| User | `postgres` |
| Password | _(empty)_ |

> If your PostgreSQL setup requires a password or different user, edit `db/knexfile.js` accordingly.

### 3. Run database migrations and seeds

```bash
npx knex migrate:latest --knexfile db/knexfile.js
npx knex seed:run --knexfile db/knexfile.js
```

This creates all tables (merchants, customers, orders, menu_items, line_items, receipts) and populates sample data for development.

### 4. Start the development servers

The app runs two servers in development:

| Server | Port | Purpose |
|--------|------|---------|
| Express API | 3000 | REST API, webhook handlers, SSR views |
| Vite Dev Server | 3001 | React frontend with HMR |

**Option A — Start both together:**

```bash
NODE_OPTIONS='--import tsx/esm' pnpm run dev
```

**Option B — Start separately (recommended):**

```bash
# Terminal 1: Express backend
NODE_ENV=development npx tsx ./bin/www

# Terminal 2: Vite frontend
npx vite
```

> **Why `tsx`?** The server-side JavaScript uses `require()` to import shared TypeScript modules from `src/shared/`. Plain `node` cannot resolve `.ts` extensions for CJS require calls, so `tsx` is needed to bridge this gap.

Open [http://localhost:3001](http://localhost:3001) in your browser.

### 5. Explore the app

| URL | Page |
|-----|------|
| `/` | Homepage with beta signup form |
| `/about` | About page |
| `/merchant` | Merchant POS dashboard (hardcoded to merchant ID 3) |
| `/orders/:uuid/menus` | Customer menu ordering view |
| `/receipts/:id` | Receipt view |

## Available Scripts

```bash
pnpm run dev          # Start Vite + Express concurrently
pnpm run build        # Production build (Vite)
pnpm run build:server # Compile server-side TypeScript
pnpm run build:all    # Build both client and server
pnpm run type-check   # TypeScript type checking (has pre-existing errors)
pnpm run preview      # Preview production build locally
pnpm test             # Run mocha tests
```

## Project Structure

```
├── bin/www                  # Express HTTP server entry point
├── index.html               # Vite entry HTML (development)
├── db/
│   ├── knexfile.js          # Database connection config
│   ├── knex.js              # Knex instance
│   ├── migrations/          # Database schema migrations
│   └── seeds/               # Development seed data
├── src/
│   ├── client/              # React frontend (TypeScript)
│   │   ├── js/
│   │   │   ├── index.tsx    # React entry point
│   │   │   ├── App.tsx      # Router and page layout
│   │   │   ├── api/         # API client functions
│   │   │   ├── components/  # Reusable components (ContactForm, Spinner, Lazy)
│   │   │   └── pages/       # Page components (HomeLanding, MerchantRoutes, Menus, Receipts)
│   │   ├── css/             # Stylesheets
│   │   └── assets/          # Static images
│   ├── server/              # Express backend (JavaScript)
│   │   ├── index.js         # Express app setup, routes, webhook handler
│   │   ├── constants.js     # App constants (tax rates, config)
│   │   ├── routes/          # API route handlers
│   │   ├── models/          # Database models (Orders, Customers, Merchants, etc.)
│   │   ├── services/        # Business logic (Actions, Dialog, GraphAPI, Airtable)
│   │   └── views/           # EJS templates (SSR fallback)
│   ├── shared/              # Shared TypeScript modules (order statuses, payment types)
│   └── types/               # Global TypeScript type definitions
├── specs/                   # Mocha test specs
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config (client)
└── tsconfig.server.json     # TypeScript config (server)
```

## Environment Variables

Create a `.env` file in the project root for optional integrations:

```env
# Server
PORT=3000
NODE_ENV=development

# PostgreSQL (production only — dev uses knexfile.js defaults)
DATABASE_URL=postgres://user:pass@host:5432/eggrollpos

# Facebook Messenger (optional)
PAGE_ID=
APP_ID=
PAGE_ACCESS_TOKEN=
APP_SECRET=
VERIFY_TOKEN=
APP_URL=https://your-app.example.com
SHOP_URL=https://your-shop.example.com

# Airtable lead capture (optional)
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=

# Zomato nearby search (optional)
ZOMATO_API_KEY=
ZOMATO_API_URL=
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/merchants/:id/orders` | Get merchant orders (with date/status filters) |
| POST | `/api/merchants/:id/orders` | Update order status |
| GET | `/api/merchants/:id/menu` | Get merchant menu items |
| GET | `/api/orders/:uuid` | Get order with menus and line items |
| POST | `/api/orders/lineitems` | Add line item to order |
| POST | `/api/orders/complete` | Complete order selection |
| POST | `/api/contact` | Submit contact/lead form |
| GET | `/r/:receiptId` | Get receipt data |
| GET/POST | `/webhook` | Facebook Messenger webhook |

## Database Migrations

```bash
# Run all pending migrations
npx knex migrate:latest --knexfile db/knexfile.js

# Roll back the last batch
npx knex migrate:rollback --knexfile db/knexfile.js

# Run seeds (development data)
npx knex seed:run --knexfile db/knexfile.js
```

## Production Build

```bash
pnpm run build        # Builds client assets to dist/
pnpm run start        # Starts Express in production mode
```

In production, the Express server serves the built static assets from `/dist`.

## License

Open source — free for restaurants to self-host and customize.
