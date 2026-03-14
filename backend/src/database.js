'use strict';

const { createClient } = require('@libsql/client');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/dashboard.db');
const dbUrl = `file:${dbPath}`;

const client = createClient({ url: dbUrl });

async function initDatabase() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS themes (
      user_id TEXT PRIMARY KEY,
      theme TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dashboard_layouts (
      user_id TEXT PRIMARY KEY,
      layout TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS widgets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      config TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = { client, initDatabase };
