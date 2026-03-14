'use strict';

const express = require('express');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Known status endpoint candidates across Gluetun versions
const STATUS_PATHS = [
  '/v1/openvpn/status',
  '/v1/vpn/status',
  '/v1/wireguard/status',
  '/openvpn/status',
  '/vpn/status',
];

const PUBLICIP_PATHS = [
  '/v1/publicip/ip',
  '/publicip/ip',
];

function buildAuthHeader(username, password) {
  if (!username && !password) return {};
  return { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}` };
}

async function tryGet(base, path, extraHeaders = {}) {
  const r = await fetch(`${base}${path}`, {
    signal: AbortSignal.timeout(5000),
    headers: { Accept: 'application/json', ...extraHeaders },
  });
  return { ok: r.ok, status: r.status, path, body: r.ok ? await r.json() : null };
}

async function findEndpoint(base, candidates, extraHeaders = {}) {
  for (const path of candidates) {
    try {
      const result = await tryGet(base, path, extraHeaders);
      if (result.ok) return result;
    } catch {
      // connection error on this path — try next
    }
  }
  return null;
}

function validateBase(baseUrl) {
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'Only http/https URLs are allowed';
    }
    return null;
  } catch {
    return 'Invalid URL';
  }
}

// POST /api/integrations/gluetun
router.post('/', async (req, res) => {
  const { baseUrl, username, password } = req.body;
  if (!baseUrl) return res.status(400).json({ error: 'baseUrl is required' });

  const base = baseUrl.replace(/\/$/, '');
  const urlError = validateBase(base);
  if (urlError) return res.status(400).json({ error: urlError });

  const authHeader = buildAuthHeader(username, password);

  try {
    const [statusResult, ipResult] = await Promise.all([
      findEndpoint(base, STATUS_PATHS, authHeader),
      findEndpoint(base, PUBLICIP_PATHS, authHeader),
    ]);

    if (!statusResult) {
      return res.status(502).json({
        error:
          'No Gluetun status endpoint found. Tried: ' + STATUS_PATHS.join(', ') +
          '. Make sure you are using the control server port (default 8000), not the HTTP proxy port (8888).',
      });
    }

    return res.json({
      vpnStatus: statusResult.body,
      publicIp: ipResult?.body ?? null,
    });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
});

// PUT /api/integrations/gluetun/status
router.put('/status', async (req, res) => {
  const { baseUrl, status, username, password } = req.body;
  if (!baseUrl) return res.status(400).json({ error: 'baseUrl is required' });
  if (status !== 'running' && status !== 'stopped') {
    return res.status(400).json({ error: 'status must be "running" or "stopped"' });
  }

  const base = baseUrl.replace(/\/$/, '');
  const urlError = validateBase(base);
  if (urlError) return res.status(400).json({ error: urlError });

  const authHeader = buildAuthHeader(username, password);

  // Find which status path works, then PUT to it
  const working = await findEndpoint(base, STATUS_PATHS, authHeader);
  if (!working) {
    return res.status(502).json({ error: 'No Gluetun status endpoint found' });
  }

  try {
    const r = await fetch(`${base}${working.path}`, {
      method: 'PUT',
      signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...authHeader },
      body: JSON.stringify({ status }),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ error: body.error ?? `HTTP ${r.status}` });
    return res.json(body);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
});

// POST /api/integrations/gluetun/probe — diagnostic: shows what paths respond
router.post('/probe', async (req, res) => {
  const { baseUrl, username, password } = req.body;
  if (!baseUrl) return res.status(400).json({ error: 'baseUrl is required' });

  const base = String(baseUrl).replace(/\/$/, '');
  const urlError = validateBase(base);
  if (urlError) return res.status(400).json({ error: urlError });

  const authHeader = buildAuthHeader(username, password);

  const allPaths = [
    '/',
    ...STATUS_PATHS,
    ...PUBLICIP_PATHS,
    '/v1/dns/status',
    '/v1/updater/status',
    '/v1/portforwarding',
  ];

  const results = await Promise.all(
    allPaths.map(async (path) => {
      try {
        const r = await fetch(`${base}${path}`, {
          signal: AbortSignal.timeout(4000),
          headers: { Accept: 'application/json', ...authHeader },
        });
        let body = null;
        try { body = await r.text(); } catch { /* ignore */ }
        return { path, httpStatus: r.status, ok: r.ok, body: body?.slice(0, 120) };
      } catch (err) {
        return { path, error: err instanceof Error ? err.message : 'failed' };
      }
    })
  );

  return res.json({ base, results });
});

module.exports = router;
