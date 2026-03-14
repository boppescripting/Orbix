# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Backend:**
```bash
cd backend && npm run dev   # nodemon auto-reload on :3001
cd backend && npm start     # production
```

**Frontend:**
```bash
cd frontend && npm run dev  # Vite dev server on :5173, proxies /api → localhost:3001
cd frontend && npm run build
```

**Docker (full stack):**
```bash
docker-compose up --build
```

There are no tests.

## Architecture

Orbix is a self-hosted personal dashboard. The frontend is a React SPA served by nginx; the backend is an Express API. In production both run in Docker with nginx proxying `/api/*` to the backend container. In development, Vite's dev proxy handles `/api` forwarding.

**Database:** LibSQL (SQLite via `@libsql/client`) — chosen over `better-sqlite3` because it ships prebuilt binaries compatible with Node 24. All DB calls are async using `client.execute({ sql, args })`. Schema: `users`, `themes`, `dashboard_layouts`, `widgets`.

**Auth:** JWT (7-day expiry, signed with `JWT_SECRET` env var). Tokens are stored in `localStorage` as `orbix_token` and sent as `Authorization: Bearer <token>`. The backend `authMiddleware` validates the token on all protected routes. All integration routes require auth.

**Theme:** CSS custom properties (`--color-background`, `--color-primary`, etc.) are injected onto `document.documentElement` by `ThemeContext`. Stored per-user in the DB.

## Widget System

The widget registry (`frontend/src/widgets/registry.tsx`) is the single place to add new widget types. Each entry requires:
- `type` — unique string key
- `component` — React component receiving `WidgetProps` (`config`, `onConfigChange`, `editMode`)
- `configComponent` — optional settings panel receiving `WidgetConfigProps` (`config`, `onChange`)
- `defaultSize` / `defaultConfig`

`WidgetWrapper` handles the chrome (drag handle, gear/remove buttons, inline name editing). The gear icon opens the `configComponent` in place of the widget body. Drag and resize are disabled when `editMode` is false.

Widget config is a free-form `Record<string, unknown>` stored as JSON in the DB and passed directly into the component — no schema enforcement.

## Integration Widgets

All integrations proxy through the backend to avoid browser CORS restrictions. The pattern is:
1. Frontend POSTs to `/api/integrations/<name>` with target URL + credentials
2. Backend fetches the real service and returns normalized data

Integration routes live in `backend/src/routes/integrations/`. When adding a new integration, also mount it in `backend/src/index.js`.

**Credential handling:** Credentials are sent in the POST body on every request (not stored server-side beyond the widget config in the DB). Basic Auth headers are built server-side with `Buffer.from('user:pass').toString('base64')`.

**Weather** uses Open-Meteo (no API key). **AdGuard** uses session-cookie auth (POST `/control/login` → cookie). **Jellyfin** uses `Authorization: MediaBrowser Token="<key>"`. **Jellyseerr** uses `X-Api-Key`. **Gluetun** uses HTTP Basic Auth with credentials from `auth/config.toml`.

## Key Environment Variables

| Var | Default | Purpose |
|-----|---------|---------|
| `JWT_SECRET` | `change-me-in-production` | JWT signing |
| `PORT` | `3001` | Backend port |
| `DB_PATH` | `/app/data/dashboard.db` | SQLite file location |
