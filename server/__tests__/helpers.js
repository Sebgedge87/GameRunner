/**
 * Test helpers — call setup() before importing app to point DB at a temp in-memory store.
 * Each test file should:
 *   const { getApp, gmAgent, playerAgent, gmToken, playerToken } = require('./helpers');
 *   beforeAll(async () => { await setup(); });
 *   afterAll(async () => { await teardown(); });
 */
const os = require('os');
const fs = require('fs');
const path = require('path');
const supertest = require('supertest');

let _tmpDb;
let _tmpVault;
let _app;

/** Call once per test file, before any other requires of server modules */
async function setup() {
  // Use unique temp paths so Jest workers don't cross-contaminate
  const suffix = `${process.pid}-${Date.now()}`;
  _tmpDb = path.join(os.tmpdir(), `chronicle-test-${suffix}.db`);
  _tmpVault = path.join(os.tmpdir(), `chronicle-vault-${suffix}`);
  fs.mkdirSync(_tmpVault, { recursive: true });

  process.env.DB_PATH = _tmpDb;
  process.env.VAULT_PATH = _tmpVault;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.REGISTRATION_OPEN = 'true';

  // Fresh require — Jest isolates modules per file so this is the first load
  const { runMigrations } = require('../src/db/migrations');
  runMigrations();
  _app = require('../src/app');
  return _app;
}

async function teardown() {
  try { if (_tmpDb) fs.unlinkSync(_tmpDb); } catch (_) {}
  try { if (_tmpVault) fs.rmSync(_tmpVault, { recursive: true, force: true }); } catch (_) {}
}

function getApp() { return _app; }

/** Register + login a user, return { token, user, agent } */
async function createUser(username, password, isFirstUser = false) {
  const app = getApp();
  if (isFirstUser) {
    // First user always becomes GM
    await supertest(app).post('/api/auth/register').send({ username, password, character_name: 'Test GM' });
    // Promote to GM
    const db = require('../src/db/database').getDb();
    db.prepare("UPDATE users SET role='gm' WHERE username=?").run(username);
  } else {
    await supertest(app).post('/api/auth/register').send({ username, password, character_name: username });
  }
  const res = await supertest(app).post('/api/auth/login').send({ username, password });
  return { token: res.body.token, user: res.body.user };
}

/** Returns a supertest agent pre-authorized with the given token */
function authed(token) {
  const agent = supertest.agent(getApp());
  // Wrap request methods to inject Authorization header automatically
  return {
    get: (url) => agent.get(url).set('Authorization', `Bearer ${token}`),
    post: (url) => agent.post(url).set('Authorization', `Bearer ${token}`),
    put: (url) => agent.put(url).set('Authorization', `Bearer ${token}`),
    delete: (url) => agent.delete(url).set('Authorization', `Bearer ${token}`),
  };
}

module.exports = { setup, teardown, getApp, createUser, authed };
