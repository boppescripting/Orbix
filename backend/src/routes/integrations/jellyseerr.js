'use strict';

const express = require('express');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// POST /api/integrations/jellyseerr
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

  const headers = { 'X-Api-Key': apiKey, Accept: 'application/json' };

  async function jsfetch(path) {
    const r = await fetch(`${base}${path}`, { headers, signal: AbortSignal.timeout(10000) });
    if (r.status === 401 || r.status === 403) {
      throw Object.assign(new Error('Invalid API key'), { status: 401 });
    }
    if (!r.ok) throw new Error(`Jellyseerr returned HTTP ${r.status}`);
    return r.json();
  }

  try {
    const [counts, requestsData, status] = await Promise.all([
      jsfetch('/api/v1/request/count'),
      jsfetch('/api/v1/request?take=8&filter=all&sort=added'),
      jsfetch('/api/v1/status'),
    ]);

    // Fetch media titles for each request in parallel
    const requests = requestsData.results ?? [];
    const withTitles = await Promise.all(
      requests.map(async (req) => {
        try {
          const type = req.type === 'movie' ? 'movie' : 'tv';
          const tmdbId = req.media?.tmdbId;
          if (!tmdbId) return { ...req, mediaTitle: null };
          const media = await jsfetch(`/api/v1/${type}/${tmdbId}`);
          return { ...req, mediaTitle: media.title ?? media.name ?? null };
        } catch {
          return { ...req, mediaTitle: null };
        }
      })
    );

    return res.json({ counts, requests: withTitles, status });
  } catch (err) {
    const httpStatus = err.status ?? 502;
    return res.status(httpStatus).json({ error: err.message });
  }
});

module.exports = router;
