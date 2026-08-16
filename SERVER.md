# DesiStorage - Server (Backend)

> A Fastify-based REST API with MongoDB (Mongoose) for the DesiStorage cloud storage platform.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Fastify | 5.12.0 |
| **Language** | TypeScript | 6.0.3 |
| **Module System** | ESM (`"type": "module"`) | - |
| **Runtime** | Node.js (tsx for dev) | - |
| **Database** | MongoDB via Mongoose | 9.9.2 |
| **Env Management** | dotenv + Zod validation | 17.4.2 / ^4.4.3 |
| **Validation** | Zod | ^4.4.3 |
| **CORS** | @fastify/cors | 11.3.0 |
| **Security Headers** | @fastify/helmet | 13.1.0 |
| **HTTP Helpers** | @fastify/sensible | 6.0.5 |
| **Plugin System** | fastify-plugin | 6.0.0 |
| **Logging** | Pino + pino-pretty (dev) | - |
| **Linting** | ESLint 10 + typescript-eslint | - |
| **Formatting** | Prettier | 3.9.6 |

## Getting Started

```bash
cd server
npm install
npm run dev
```

The API runs at [http://localhost:5000](http://localhost:5000).

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Start compiled production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |

## Project Structure

```
src/
├── app.ts                        # Fastify app creation + plugin registration
├── server.ts                     # Entry point: starts listening
├── config/
│   └── env.ts                    # Typed env config via Zod schema
├── controllers/
│   └── user.controller.ts        # User controller (placeholder)
├── lib/
│   └── logger.ts                 # Pino logger config
├── models/                       # Mongoose models (empty - to be added)
├── plugins/
│   ├── cors.ts                   # @fastify/cors plugin
│   ├── helmet.ts                 # @fastify/helmet plugin
│   └── mongoose.ts               # Mongoose connection/disconnection plugin
├── routes/
│   ├── index.ts                  # Mounts v1 routes under /api
│   ├── health.route.ts           # GET /health
│   └── v1/
│       ├── index.ts              # Mounts auth routes under /api/v1/auth
│       └── auth.route.ts         # Auth routes (placeholder)
└── services/
    └── user.service.ts           # User service (commented-out placeholder)
```

## Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=5000
HOST=localhost
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/DesiStorage
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |

> More routes to be added as features are implemented.

## Current Status

The server is a scaffolded skeleton:
- Fastify app with CORS, Helmet, and Mongoose plugins registered
- Environment config validated with Zod
- Health check route functional
- Models, controllers, and services are placeholders (to be implemented)
