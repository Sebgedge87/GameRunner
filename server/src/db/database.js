const { DatabaseSync } = require('node:sqlite');
const { dbPath } = require('../config');

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(dbPath);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
  }
  return db;
}

function getActiveCampaignId() {
  const row = getDb().prepare('SELECT id FROM campaigns WHERE active = 1 LIMIT 1').get();
  return row ? row.id : null;
}

module.exports = { getDb, getActiveCampaignId };
