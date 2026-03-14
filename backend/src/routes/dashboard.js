'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { client } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const DEFAULT_THEME = {
  background: '#0f172a',
  surface: '#1e293b',
  surfaceHover: '#334155',
  primary: '#6366f1',
  primaryHover: '#4f46e5',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  border: '#334155',
  success: '#10b981',
  danger: '#ef4444',
  widgetBackground: '#1e293b',
  widgetBorder: '#334155',
};

// GET /api/dashboard/layout
router.get('/layout', async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT layout FROM dashboard_layouts WHERE user_id = ?',
      args: [req.userId],
    });
    const layout = result.rows.length > 0 ? JSON.parse(result.rows[0].layout) : [];
    return res.json(layout);
  } catch (err) {
    console.error('Get layout error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/dashboard/layout
router.put('/layout', async (req, res) => {
  try {
    const { layout } = req.body;
    if (!Array.isArray(layout)) {
      return res.status(400).json({ error: 'layout must be an array' });
    }

    const layoutStr = JSON.stringify(layout);
    await client.execute({
      sql: 'INSERT OR REPLACE INTO dashboard_layouts (user_id, layout) VALUES (?, ?)',
      args: [req.userId, layoutStr],
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Save layout error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/widgets
router.get('/widgets', async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT id, user_id, type, config, created_at FROM widgets WHERE user_id = ?',
      args: [req.userId],
    });

    const widgets = result.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      config: JSON.parse(row.config),
      created_at: row.created_at,
    }));

    return res.json(widgets);
  } catch (err) {
    console.error('Get widgets error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/dashboard/widgets
router.post('/widgets', async (req, res) => {
  try {
    const { type, config } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'type is required' });
    }

    const id = uuidv4();
    const configStr = JSON.stringify(config || {});

    await client.execute({
      sql: 'INSERT INTO widgets (id, user_id, type, config) VALUES (?, ?, ?, ?)',
      args: [id, req.userId, type, configStr],
    });

    const result = await client.execute({
      sql: 'SELECT id, user_id, type, config, created_at FROM widgets WHERE id = ?',
      args: [id],
    });

    const widget = result.rows[0];
    return res.status(201).json({ ...widget, config: JSON.parse(widget.config) });
  } catch (err) {
    console.error('Create widget error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/dashboard/widgets/:id
router.put('/widgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { config } = req.body;

    const check = await client.execute({
      sql: 'SELECT id, user_id FROM widgets WHERE id = ?',
      args: [id],
    });

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    if (check.rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const configStr = JSON.stringify(config || {});
    await client.execute({
      sql: 'UPDATE widgets SET config = ? WHERE id = ?',
      args: [configStr, id],
    });

    const result = await client.execute({
      sql: 'SELECT id, user_id, type, config, created_at FROM widgets WHERE id = ?',
      args: [id],
    });

    const widget = result.rows[0];
    return res.json({ ...widget, config: JSON.parse(widget.config) });
  } catch (err) {
    console.error('Update widget error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/dashboard/widgets/:id
router.delete('/widgets/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const check = await client.execute({
      sql: 'SELECT id, user_id FROM widgets WHERE id = ?',
      args: [id],
    });

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    if (check.rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await client.execute({ sql: 'DELETE FROM widgets WHERE id = ?', args: [id] });
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete widget error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/theme
router.get('/theme', async (req, res) => {
  try {
    const result = await client.execute({
      sql: 'SELECT theme FROM themes WHERE user_id = ?',
      args: [req.userId],
    });
    const theme = result.rows.length > 0 ? JSON.parse(result.rows[0].theme) : DEFAULT_THEME;
    return res.json(theme);
  } catch (err) {
    console.error('Get theme error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/dashboard/theme
router.put('/theme', async (req, res) => {
  try {
    const theme = req.body;
    if (!theme || typeof theme !== 'object') {
      return res.status(400).json({ error: 'theme must be an object' });
    }

    const themeStr = JSON.stringify(theme);
    await client.execute({
      sql: 'INSERT OR REPLACE INTO themes (user_id, theme) VALUES (?, ?)',
      args: [req.userId, themeStr],
    });

    return res.json(theme);
  } catch (err) {
    console.error('Save theme error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
