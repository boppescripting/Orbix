'use strict';

const express = require('express');
const http = require('http');
const https = require('https');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const SOCKET_PATH = '/var/run/docker.sock';

// Unified Docker request — uses Unix socket when no URL given, HTTP/S otherwise
function dockerRequest(path, method = 'GET', baseUrl = '') {
  return new Promise((resolve, reject) => {
    const options = baseUrl
      ? (() => {
          const u = new URL(path, baseUrl);
          return {
            hostname: u.hostname,
            port: u.port,
            path: u.pathname + u.search,
            method,
          };
        })()
      : {
          socketPath: SOCKET_PATH,
          path,
          method,
        };

    const lib = baseUrl?.startsWith('https') ? https : http;
    const req = lib.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.setTimeout(8000, () => { req.destroy(new Error('Request timed out')); });
    req.on('error', reject);
    req.end();
  });
}

function fmtBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i >= 2 ? 1 : 0)} ${units[i]}`;
}

function calcCpu(stats) {
  try {
    const cpuDelta =
      stats.cpu_stats.cpu_usage.total_usage -
      stats.precpu_stats.cpu_usage.total_usage;
    const sysDelta =
      stats.cpu_stats.system_cpu_usage -
      stats.precpu_stats.system_cpu_usage;
    const numCpus =
      stats.cpu_stats.online_cpus ||
      stats.cpu_stats.cpu_usage.percpu_usage?.length ||
      1;
    if (sysDelta <= 0) return 0;
    return Math.round((cpuDelta / sysDelta) * numCpus * 1000) / 10;
  } catch {
    return 0;
  }
}

// POST /api/integrations/dockerstats
router.post('/', async (req, res) => {
  const baseUrl = (req.body.url ?? '').trim();

  try {
    const listResp = await dockerRequest('/containers/json?all=true', 'GET', baseUrl);
    if (listResp.status !== 200) {
      return res.status(502).json({ error: `Docker API returned HTTP ${listResp.status}` });
    }
    const list = JSON.parse(listResp.body);

    const containers = await Promise.all(
      list.map(async (c) => {
        const name = (c.Names?.[0] ?? c.Id.slice(0, 12)).replace(/^\//, '');
        const baseInfo = {
          id: c.Id,
          shortId: c.Id.slice(0, 12),
          name,
          image: c.Image,
          state: c.State,
          status: c.Status,
          cpuPercent: 0,
          memUsageFmt: '—',
          memLimitFmt: '—',
          memPercent: 0,
        };

        if (c.State !== 'running') return baseInfo;

        try {
          const statsResp = await dockerRequest(
            `/containers/${c.Id}/stats?stream=false`,
            'GET',
            baseUrl
          );
          if (statsResp.status !== 200) return baseInfo;
          const stats = JSON.parse(statsResp.body);

          const cpuPercent = calcCpu(stats);
          const memUsage =
            (stats.memory_stats?.usage ?? 0) -
            (stats.memory_stats?.stats?.cache ?? 0);
          const memLimit = stats.memory_stats?.limit ?? 0;
          const memPercent =
            memLimit > 0 ? Math.round((memUsage / memLimit) * 1000) / 10 : 0;

          return {
            ...baseInfo,
            cpuPercent,
            memPercent,
            memUsageFmt: fmtBytes(memUsage),
            memLimitFmt: fmtBytes(memLimit),
          };
        } catch {
          return baseInfo;
        }
      })
    );

    const running = containers.filter((c) => c.state === 'running').length;
    return res.json({ total: containers.length, running, containers });
  } catch (err) {
    const cause = err.cause?.message ?? err.cause?.code ?? err.message;
    return res.status(502).json({ error: cause });
  }
});

// POST /api/integrations/dockerstats/action
router.post('/action', async (req, res) => {
  const { containerId, action } = req.body;
  const baseUrl = (req.body.url ?? '').trim();

  if (!containerId || !action) {
    return res.status(400).json({ error: 'containerId and action are required' });
  }
  if (!['start', 'stop', 'restart'].includes(action)) {
    return res.status(400).json({ error: 'action must be start, stop, or restart' });
  }

  try {
    const r = await dockerRequest(`/containers/${containerId}/${action}`, 'POST', baseUrl);
    // 204 = success, 304 = already in desired state
    if (r.status !== 204 && r.status !== 304) {
      return res.status(502).json({ error: `Docker returned HTTP ${r.status}: ${r.body}` });
    }
    return res.json({ success: true });
  } catch (err) {
    const cause = err.cause?.message ?? err.cause?.code ?? err.message;
    return res.status(502).json({ error: cause });
  }
});

module.exports = router;
