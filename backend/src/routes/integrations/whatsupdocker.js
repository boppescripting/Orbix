'use strict';

const express = require('express');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

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

// POST /api/integrations/whatsupdocker
router.post('/', async (req, res) => {
  const { baseUrl, username, password } = req.body;
  if (!baseUrl) return res.status(400).json({ error: 'baseUrl is required' });

  const base = baseUrl.replace(/\/$/, '');
  const urlError = validateBase(base);
  if (urlError) return res.status(400).json({ error: urlError });

  const headers = { Accept: 'application/json' };
  if (username || password) {
    headers.Authorization = `Basic ${Buffer.from(`${username ?? ''}:${password ?? ''}`).toString('base64')}`;
  }

  try {
    const r = await fetch(`${base}/api/containers`, {
      headers,
      signal: AbortSignal.timeout(8000),
    });

    if (r.status === 401 || r.status === 403) {
      return res.status(401).json({ error: 'Unauthorized — check credentials' });
    }
    if (!r.ok) {
      return res.status(502).json({ error: `What's Up Docker returned HTTP ${r.status}` });
    }

    const containers = await r.json();

    const running  = containers.filter(c => c.status === 'running').length;
    const updates  = containers.filter(c => c.updateAvailable);

    return res.json({
      total:   containers.length,
      running,
      updates: updates.length,
      containers: containers.map(c => ({
        id:              c.id,
        name:            (c.name ?? '').replace(/^\//, ''),
        currentTag:      c.image?.tag?.value ?? '?',
        newTag:          c.result?.tag ?? null,
        updateAvailable: !!c.updateAvailable,
        status:          c.status ?? 'unknown',
        image:           c.image?.name ?? '',
      })),
    });
  } catch (err) {
    const cause = err.cause?.message ?? err.cause?.code;
    const msg = cause ? `${err.message}: ${cause}` : err.message;
    return res.status(502).json({ error: msg });
  }
});

module.exports = router;
