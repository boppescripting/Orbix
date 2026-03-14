'use strict';

const express = require('express');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// POST /api/integrations/adguard
// Logs in to AdGuard Home, then fetches stats + status in one call.
// Body: { baseUrl, username, password }
router.post('/', async (req, res) => {
  const { baseUrl, username, password } = req.body;

  if (!baseUrl) {
    return res.status(400).json({ error: 'baseUrl is required' });
  }

  const base = baseUrl.replace(/\/$/, '');

  // Validate URL
  try {
    const parsed = new URL(base);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return res.status(400).json({ error: 'Only http/https URLs are allowed' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const timeout = AbortSignal.timeout(10000);

  try {
    let cookie = null;

    // If credentials provided, log in to get a session cookie
    if (username || password) {
      const loginRes = await fetch(`${base}/control/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username, password }),
        signal: timeout,
      });

      if (loginRes.status === 403 || loginRes.status === 401) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (!loginRes.ok) {
        return res.status(502).json({ error: `AdGuard login failed: HTTP ${loginRes.status}` });
      }

      // Extract session cookie
      const setCookie = loginRes.headers.get('set-cookie');
      if (setCookie) {
        // Pull out just the cookie value (name=value), strip flags
        cookie = setCookie.split(';')[0].trim();
      }
    }

    const fetchHeaders = cookie ? { Cookie: cookie } : {};

    // Fetch stats and status in parallel
    const [statsRes, statusRes] = await Promise.all([
      fetch(`${base}/control/stats`, { headers: fetchHeaders, signal: AbortSignal.timeout(10000) }),
      fetch(`${base}/control/status`, { headers: fetchHeaders, signal: AbortSignal.timeout(10000) }),
    ]);

    if (statsRes.status === 401 || statusRes.status === 401) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!statsRes.ok || !statusRes.ok) {
      const code = !statsRes.ok ? statsRes.status : statusRes.status;
      return res.status(502).json({ error: `AdGuard returned HTTP ${code}` });
    }

    const [stats, status] = await Promise.all([statsRes.json(), statusRes.json()]);
    return res.json({ stats, status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(502).json({ error: msg });
  }
});

module.exports = router;
