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

// Prefer the campaign ID sent by the client (X-Campaign-Id header) so each
// user can view a different campaign simultaneously.  Falls back to the
// globally-active campaign for legacy/server-side callers that don't have a
// request object.
function getCampaignId(req) {
  const fromHeader = req?.headers?.['x-campaign-id'];
  if (fromHeader) {
    const parsed = parseInt(fromHeader, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return getActiveCampaignId();
}

module.exports = { getDb, getActiveCampaignId, getCampaignId };
