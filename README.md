# DesiStorage

A full-stack cloud storage platform inspired by Google Drive / Dropbox, built with **Next.js 16** (frontend) and **Fastify + MongoDB** (backend).

## Project Structure

```
DesiStorage/
├── client/           # Frontend - Next.js 16 + React 19 + Tailwind CSS v4
├── server/           # Backend  - Fastify 5 + Mongoose 9 + TypeScript
├── CLIENT.md         # Frontend tech stack & documentation
├── SERVER.md         # Backend tech stack & documentation
└── README.md         # This file
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | Fastify 5, TypeScript, Mongoose 9, Zod |
| Database | MongoDB |

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB running locally or a connection string

### Frontend

```bash
cd client
npm install
npm run dev
```

Runs at [http://localhost:3000](http://localhost:3000).

### Backend

```bash
cd server
cp .env.example .env    # configure your env vars
npm install
npm run dev
```

Runs at [http://localhost:5000](http://localhost:5000).

## Branches

| Branch | Purpose |
|---|---|
| `main` | Stable production-ready code |
| `development` | Active development |
| `features/client-landing-page` | Landing page feature |
| `features/client-auth-pages` | Auth pages feature |
| `features/backend-setup` | Backend scaffolding and setup |

## Documentation

- [CLIENT.md](./CLIENT.md) - Frontend architecture, components, and usage
- [SERVER.md](./SERVER.md) - Backend architecture, plugins, and API docs
