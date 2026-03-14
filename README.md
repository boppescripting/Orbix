# Orbix

A self-hosted personal dashboard with a dark brutalist aesthetic. Add widgets for your homelab services, media servers, network tools, and more — all on a drag-and-drop grid you can fully customize.

---

## Features

- **Drag-and-drop grid** — freely position and resize any widget
- **Edit mode** — lock the dashboard when you're done arranging
- **Theme editor** — customize every color, font family, and font weight live, with changes saved per user
- **Multi-user** — each user has their own dashboard layout and theme
- **Spotlight search** — press `Space` anywhere on the dashboard to open a quick search bar; cycles between Google, DuckDuckGo, Bing, and Brave with `Tab`; remembers your last-used engine
- **Add Widget modal** — categorized widget browser with live search
- **Integration widgets** — all external service calls are proxied through the backend to avoid CORS issues
- **Widget settings** — each integration widget has an inline settings panel for configuring URLs, API keys, and refresh intervals
- **Self-contained** — SQLite database, no external database required

---

## Widgets

### Utilities

| Widget | Description |
|--------|-------------|
| **Clock** | Current time and date with timezone and 12h/24h format options |
| **Notes** | Sticky notepad saved to your dashboard |
| **Bookmarks** | Quick-access link list, editable in edit mode |
| **Search** | Web search bar supporting Google, DuckDuckGo, Bing, and Brave |
| **Web Embed** | Embed any webpage in an iframe |

### Information

| Widget | Description |
|--------|-------------|
| **Weather** | Current conditions for any city via Open-Meteo (no API key required) |

### Media

| Widget | Description |
|--------|-------------|
| **Jellyfin** | Active streams, recently added media (with links), server status |
| **Jellyseerr** | Pending and recent media requests |

### Network

| Widget | Description |
|--------|-------------|
| **AdGuard Home** | DNS query stats, block rate, top blocked domains |
| **Gluetun** | VPN connection status, public IP, country |
| **Cloudflare Tunnels** | Health status of all tunnels in a Cloudflare account |

### Downloads & Containers

| Widget | Description |
|--------|-------------|
| **qBittorrent** | Active downloads with progress, speed, ETA; seeding count |
| **What's Up Docker** | Container update availability across your Docker host |
| **Docker Stats** | Per-container CPU %, memory usage, state dot, and start/stop/restart actions |

---

## Installation

### Docker (recommended)

```yaml
services:
  backend:
    image: ghcr.io/boppescripting/orbix-backend:latest
    ports:
      - "3001:3001"
    volumes:
      - /opt/orbix/data:/app/data
      - /var/run/docker.sock:/var/run/docker.sock  # only needed for Docker Stats widget
    environment:
      - JWT_SECRET=your-secret-here
      - DB_PATH=/app/data/dashboard.db
    restart: unless-stopped

  frontend:
    image: ghcr.io/boppescripting/orbix-frontend:latest
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

```bash
mkdir -p /opt/orbix/data
docker compose up -d
```

Then open `http://your-server:3000` and create an account.

> **Important:** Set `JWT_SECRET` to a long random string. The database is stored at the path you mount — back it up to preserve your layout and settings.

### Build from source

**Requirements:** Node.js 20+

```bash
# Backend
cd backend
npm install
JWT_SECRET=dev-secret DB_PATH=./data/dashboard.db node src/index.js

# Frontend (separate terminal)
cd frontend
npm install
npm run dev   # available at http://localhost:5173
```

The Vite dev server proxies all `/api` requests to `localhost:3001` automatically.

---

## Integration Setup

All integrations require only the URL of the service on your local network and any credentials. Nothing is stored on the backend beyond what's in your widget config.

### AdGuard Home
- **URL:** `http://your-adguard:3000`
- **Auth:** username + password

### Jellyfin
- **URL:** `http://your-jellyfin:8096`
- **API Key:** Dashboard → Administration → API Keys → Add

### Jellyseerr
- **URL:** `http://your-jellyseerr:5055`
- **API Key:** Settings → General → API Key

### Gluetun
- **URL:** `http://your-gluetun:8000`
- **Auth:** Optional — configure in `auth/config.toml` inside your Gluetun container

### qBittorrent
- **URL:** `http://your-qbittorrent:8080`
- **Auth:** username + password (Web UI credentials)

### What's Up Docker
- **URL:** `http://your-wud:3000`
- **Auth:** Optional Basic Auth if configured

### Cloudflare Tunnels
- **Account ID:** Found on the Cloudflare dashboard sidebar
- **API Token:** Create at Cloudflare → My Profile → API Tokens with `Account:Cloudflare Tunnel:Read` permission

### Docker Stats
- **URL:** Leave empty to use the Docker socket at `/var/run/docker.sock` (requires the socket volume mount in your compose file). Or provide an HTTP URL for TCP access, e.g. `http://host:2375`.
- The widget displays CPU %, memory usage with a color-coded bar, container state, and buttons to start, stop, or restart each container.

### Weather
- No API key required. Just enter a city name.

---

## Creating a New Widget

### 1. Create the widget component

Create `frontend/src/widgets/MyWidget.tsx`. The component receives `WidgetProps`:

```tsx
import React from 'react';
import type { WidgetProps, WidgetConfigProps } from '../types';
import { authHeaders } from '../utils';

export default function MyWidget({ config }: WidgetProps) {
  const label = config.label as string;
  return <div>{label}</div>;
}

// Optional settings panel
export function MyWidgetConfig({ config, onChange }: WidgetConfigProps) {
  return (
    <input
      value={config.label as string}
      onChange={(e) => onChange({ ...config, label: e.target.value })}
    />
  );
}
```

Use `authHeaders()` from `../utils` when making fetch calls to the backend — it returns the `Authorization` header object automatically. Use `authHeader()` (singular) when you need just the string value.

### 2. Register the widget

Add an entry to `frontend/src/widgets/registry.tsx`:

```tsx
import MyWidget, { MyWidgetConfig } from './MyWidget';

// Inside widgetRegistry array:
{
  type: 'mywidget',
  name: 'My Widget',
  description: 'A short description shown in the Add Widget modal',
  icon: '🔧',
  category: 'Utilities',          // 'Utilities' | 'Information' | 'Media' | 'Network' | 'Downloads & Containers'
  logoUrl: 'https://cdn.simpleicons.org/myservice/ffffff',  // optional, replaces icon if provided
  defaultSize: { w: 3, h: 3, minW: 2, minH: 2 },
  defaultConfig: { label: 'Hello' },
  component: MyWidget,
  configComponent: MyWidgetConfig,  // omit if no settings needed
}
```

That's all that's needed for a client-only widget. The category controls which section it appears in the Add Widget modal.

### 3. Add a backend integration (if needed)

Create `backend/src/routes/integrations/mywidget.js`:

```js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
  const { url } = req.body;
  try {
    const response = await fetch(`${url}/api/endpoint`);
    const data = await response.json();
    res.json({ value: data.someField });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

Mount it in `backend/src/index.js`:

```js
const mywidgetRoutes = require('./routes/integrations/mywidget');
app.use('/api/integrations/mywidget', mywidgetRoutes);
```

Then call it from your widget component:

```ts
const res = await fetch('/api/integrations/mywidget', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...authHeaders() },
  body: JSON.stringify({ url: config.url }),
});
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `change-me-in-production` | Secret used to sign auth tokens — change this |
| `DB_PATH` | `/app/data/dashboard.db` | Path to the SQLite database file |
