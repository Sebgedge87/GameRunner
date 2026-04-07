const { setup, teardown } = require('./helpers');
const { getDb } = require('../src/db/database');
const { syncFile } = require('../src/vault/vaultWatcher');
const fs = require('fs');
const path = require('path');

beforeAll(async () => {
  await setup();
});

afterAll(async () => {
  await teardown();
});

describe('migrations bootstrap compatibility tables/columns', () => {
  test('creates legacy factions table for FK/search compatibility', () => {
    const db = getDb();
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='factions'")
      .get();
    expect(row?.name).toBe('factions');
  });

  test('adds hidden column to vault_files', () => {
    const db = getDb();
    const columns = db.prepare("PRAGMA table_info('vault_files')").all();
    const hidden = columns.find((c) => c.name === 'hidden');
    expect(hidden).toBeTruthy();
  });

  test('vault watcher self-heals missing factions table', () => {
    const db = getDb();
    db.exec('DROP TABLE IF EXISTS factions');
    const mdPath = path.join(process.env.VAULT_PATH, 'NPCs');
    fs.mkdirSync(mdPath, { recursive: true });
    const file = path.join(mdPath, 'watcher-heal-test.md');
    fs.writeFileSync(file, '---\ntitle: Watcher Heal Test\n---\nBody');

    expect(() => syncFile(file)).not.toThrow();
    const factions = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='factions'").get();
    expect(factions?.name).toBe('factions');
  });
});
