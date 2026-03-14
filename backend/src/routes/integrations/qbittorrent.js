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

function fmtSpeed(bytesPerSec) {
  if (bytesPerSec >= 1_073_741_824) return `${(bytesPerSec / 1_073_741_824).toFixed(2)} GB/s`;
  if (bytesPerSec >= 1_048_576)     return `${(bytesPerSec / 1_048_576).toFixed(1)} MB/s`;
  if (bytesPerSec >= 1_024)         return `${(bytesPerSec / 1_024).toFixed(1)} KB/s`;
  return `${bytesPerSec} B/s`;
}

function fmtSize(bytes) {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  if (bytes >= 1_048_576)     return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024)         return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${bytes} B`;
}

const LEECH_STATES = new Set(['downloading', 'stalledDL', 'checkingDL', 'forcedDL', 'allocating', 'metaDL', 'queuedDL']);
const SEED_STATES  = new Set(['uploading', 'stalledUP', 'checkingUP', 'forcedUP', 'queuedUP']);

// POST /api/integrations/qbittorrent
router.post('/', async (req, res) => {
  const { baseUrl, username, password } = req.body;
  if (!baseUrl) return res.status(400).json({ error: 'baseUrl is required' });

  const base = baseUrl.replace(/\/$/, '');
  const urlError = validateBase(base);
  if (urlError) return res.status(400).json({ error: urlError });

  try {
    // Authenticate — qBittorrent uses cookie-based session
    const loginRes = await fetch(`${base}/api/v2/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: base },
      body: new URLSearchParams({ username: username ?? '', password: password ?? '' }),
      signal: AbortSignal.timeout(8000),
    });

    const loginBody = await loginRes.text();
    if (loginBody.trim() === 'Fails.') {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Extract SID cookie
    const sid = loginRes.headers.get('set-cookie')?.match(/SID=([^;]+)/)?.[1];
    if (!sid) {
      return res.status(502).json({ error: 'Could not obtain session cookie' });
    }

    const cookie = `SID=${sid}`;

    // Fetch torrents + transfer info in parallel
    const [torrentsRes, transferRes] = await Promise.all([
      fetch(`${base}/api/v2/torrents/info`, {
        headers: { Cookie: cookie },
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${base}/api/v2/transfer/info`, {
        headers: { Cookie: cookie },
        signal: AbortSignal.timeout(8000),
      }),
    ]);

    if (!torrentsRes.ok) return res.status(502).json({ error: `Torrents API returned ${torrentsRes.status}` });
    if (!transferRes.ok) return res.status(502).json({ error: `Transfer API returned ${transferRes.status}` });

    const [allTorrents, transfer] = await Promise.all([
      torrentsRes.json(),
      transferRes.json(),
    ]);

    const leeching = allTorrents.filter(t => LEECH_STATES.has(t.state));
    const seeding  = allTorrents.filter(t => SEED_STATES.has(t.state));

    return res.json({
      downloadSpeed: fmtSpeed(transfer.dl_info_speed ?? 0),
      uploadSpeed:   fmtSpeed(transfer.up_info_speed ?? 0),
      leechCount:    leeching.length,
      seedCount:     seeding.length,
      leeching: leeching.map(t => ({
        name:     t.name,
        progress: Math.round(t.progress * 100),
        size:     fmtSize(t.size),
        dlSpeed:  fmtSpeed(t.dlspeed ?? 0),
        eta:      t.eta,
      })),
    });
  } catch (err) {
    const cause = err.cause?.message ?? err.cause?.code;
    const msg = cause ? `${err.message}: ${cause}` : err.message;
    return res.status(502).json({ error: msg });
  }
});

module.exports = router;
