'use strict';

const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/proxy
// Headers:
//   x-proxy-url: the target URL to fetch
//   x-proxy-authorization: (optional) forwarded as Authorization to the target
router.get('/', async (req, res) => {
  const targetUrl = req.headers['x-proxy-url'];
  if (!targetUrl) {
    return res.status(400).json({ error: 'x-proxy-url header is required' });
  }

  // Only allow http/https
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only http and https URLs are allowed' });
  }

  const headers = {};
  if (req.headers['x-proxy-authorization']) {
    headers['Authorization'] = req.headers['x-proxy-authorization'];
  }

  try {
    const response = await fetch(targetUrl, { headers, signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Proxy fetch failed';
    res.status(502).json({ error: msg });
  }
});

module.exports = router;
