# DesiStorage - Client (Frontend)

> A modern cloud storage UI built with Next.js 16, React 19, and Tailwind CSS v4.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.2.12 |
| **React** | React + React DOM | 19.2.4 |
| **Language** | TypeScript | ^5 |
| **Styling** | Tailwind CSS v4 (PostCSS) | ^4 |
| **UI Components** | shadcn/ui (base-vega) | ^4.16.1 |
| **Component Primitives** | @base-ui/react | ^1.6.0 |
| **Form Management** | React Hook Form + @hookform/resolvers | ^7.85.0 / ^5.7.1 |
| **Validation** | Zod | ^4.4.3 |
| **Icons** | Lucide React | ^1.28.0 |
| **Theming** | next-themes (light/dark) | ^0.4.6 |
| **Route Progress** | NProgress | ^0.2.0 |
| **CSS Utilities** | clsx + tailwind-merge | ^2.1.1 / ^3.6.0 |
| **Animation** | tw-animate-css | ^1.4.0 |
| **React Compiler** | babel-plugin-react-compiler | 1.0.0 |
| **Linting** | ESLint 9 + eslint-config-next | - |

## Getting Started

```bash
cd client
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Auth pages (login, register, forgot-password)
│   ├── (dashboard)/              # Dashboard pages (drive, profile)
│   ├── globals.css               # Global styles + Tailwind
│   ├── layout.tsx                # Root layout (ThemeProvider, RouteProgress)
│   ├── not-found.tsx             # Custom 404
│   └── page.tsx                  # Landing page
├── components/                   # Shared components
│   ├── ui/                       # shadcn/ui primitives
│   ├── Logo.tsx
│   ├── RouteProgress.tsx         # NProgress loading bar
│   ├── ThemeProvider.tsx
│   └── ThemeToggle.tsx
├── features/                     # Feature-based modules
│   ├── auth/                     # Auth feature (login, register, forgot-password)
│   │   ├── components/           # AuthLayout, PasswordValidator, VerifyEmail
│   │   └── schema/               # Zod validation schemas
│   ├── dashboard/                # Dashboard/drive feature
│   │   ├── components/           # DashboardShell, Drive tabs, UploadPanel, etc.
│   │   ├── data/                 # Mock data
│   │   └── types/                # TypeScript types
│   ├── landing/                  # Landing page feature
│   │   └── components/           # Hero, Features, Demo, Pricing, FAQs, etc.
│   └── profile/                  # Profile/settings feature
│       ├── components/           # ProfilePage, tabs (Security, Sessions, etc.)
│       └── data/                 # Mock data
└── lib/
    └── utils.ts                  # cn() utility
```

## Key Features (UI Complete)

- Landing page (Hero, Features, Demo, Security, Pricing, Testimonials, FAQ, CTA)
- Auth flow (Login, Register with email verification, Forgot Password)
- Dashboard with tabs (My Drive, Shared, Recent, Starred, Links, Trash)
- File upload panel with context
- Profile/Settings (Profile, Security, Notifications, Sessions, Storage, Support)
- Light/Dark theme toggle
- Route loading progress bar
- Responsive design

## Environment Variables

No client-side env vars required currently (all API calls are mocked).

## Branches

| Branch | Description |
|---|---|
| `main` | Stable production-ready code |
| `development` | Active development branch |
| `features/client-landing-page` | Landing page feature |
| `features/client-auth-pages` | Auth pages feature |
