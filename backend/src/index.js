'use strict';

const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const proxyRoutes = require('./routes/proxy');
const adguardRoutes = require('./routes/integrations/adguard');
const jellyfinRoutes = require('./routes/integrations/jellyfin');
const jellyseerrRoutes = require('./routes/integrations/jellyseerr');
const gluetunRoutes = require('./routes/integrations/gluetun');
const weatherRoutes = require('./routes/integrations/weather');
const cloudflaretunnelsRoutes = require('./routes/integrations/cloudflaretunnels');
const qbittorrentRoutes = require('./routes/integrations/qbittorrent');
const whatsupdockerRoutes = require('./routes/integrations/whatsupdocker');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/integrations/adguard', adguardRoutes);
app.use('/api/integrations/jellyfin', jellyfinRoutes);
app.use('/api/integrations/jellyseerr', jellyseerrRoutes);
app.use('/api/integrations/gluetun', gluetunRoutes);
app.use('/api/integrations/weather', weatherRoutes);
app.use('/api/integrations/cloudflaretunnels', cloudflaretunnelsRoutes);
app.use('/api/integrations/qbittorrent', qbittorrentRoutes);
app.use('/api/integrations/whatsupdocker', whatsupdockerRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Orbix backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
