'use strict';

const express = require('express');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const CF_BASE = 'https://api.cloudflare.com/client/v4';

// POST /api/integrations/cloudflaretunnels
// Body: { accountId, apiToken }
router.post('/', async (req, res) => {
  const { accountId, apiToken } = req.body;
  if (!accountId) return res.status(400).json({ error: 'accountId is required' });
  if (!apiToken)  return res.status(400).json({ error: 'apiToken is required' });

  const headers = {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  };

  try {
    const r = await fetch(
      `${CF_BASE}/accounts/${encodeURIComponent(accountId)}/cfd_tunnel?is_deleted=false&per_page=50`,
      { headers, signal: AbortSignal.timeout(10000) }
    );

    const data = await r.json();

    if (!r.ok) {
      const msg = data?.errors?.[0]?.message ?? `HTTP ${r.status}`;
      const status = r.status === 401 || r.status === 403 ? r.status : 502;
      return res.status(status).json({ error: msg });
    }

    const tunnels = (data.result ?? []).map((t) => ({
      id:          t.id,
      name:        t.name,
      status:      t.status,           // healthy | down | degraded | inactive
      connections: (t.connections ?? []).length,
      createdAt:   t.created_at,
      type:        t.tun_type ?? 'cfd_tunnel',
    }));

    return res.json({ tunnels });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
});

module.exports = router;
