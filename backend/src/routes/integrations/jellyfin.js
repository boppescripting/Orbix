'use strict';

const express = require('express');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// POST /api/integrations/jellyfin
// Body: { baseUrl, apiKey }
router.post('/', async (req, res) => {
  const { baseUrl, apiKey } = req.body;

  if (!baseUrl) return res.status(400).json({ error: 'baseUrl is required' });
  if (!apiKey)  return res.status(400).json({ error: 'apiKey is required' });

  const base = baseUrl.replace(/\/$/, '');

  try {
    const parsed = new URL(base);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return res.status(400).json({ error: 'Only http/https URLs are allowed' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const headers = {
    Authorization: `MediaBrowser Token="${apiKey}"`,
    Accept: 'application/json',
  };
  const signal = AbortSignal.timeout(10000);

  async function jfetch(path) {
    const r = await fetch(`${base}${path}`, { headers, signal: AbortSignal.timeout(10000) });
    if (r.status === 401 || r.status === 403) throw Object.assign(new Error('Invalid API key'), { status: 401 });
    if (!r.ok) throw new Error(`Jellyfin returned HTTP ${r.status} for ${path}`);
    return r.json();
  }

  try {
    const [info, sessions, recentItems] = await Promise.all([
      jfetch('/System/Info'),
      jfetch('/Sessions?ActiveWithinSeconds=180'),
      jfetch('/Items?SortBy=DateCreated&SortOrder=Descending&Limit=8&Recursive=true&IncludeItemTypes=Movie,Series,Episode&Fields=DateCreated,ProductionYear,SeriesName,SeasonName'),
    ]);

    return res.json({ info, sessions, recentItems });
  } catch (err) {
    const status = err.status ?? 502;
    return res.status(status).json({ error: err.message });
  }
});

module.exports = router;
