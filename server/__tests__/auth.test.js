const { setup, teardown, getApp } = require('./helpers');
const supertest = require('supertest');

beforeAll(() => setup());
afterAll(() => teardown());

describe('Health check', () => {
  test('GET /api/health returns ok', async () => {
    const res = await supertest(getApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth — register', () => {
  test('registers the first user (becomes GM)', async () => {
    const res = await supertest(getApp())
      .post('/api/auth/register')
      .send({ username: 'gm', password: 'password1', character_name: 'Dungeon Master' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.username).toBe('gm');
  });

  test('rejects duplicate username', async () => {
    const res = await supertest(getApp())
      .post('/api/auth/register')
      .send({ username: 'gm', password: 'password1' });
    expect(res.status).toBe(409);
  });

  test('rejects short password', async () => {
    const res = await supertest(getApp())
      .post('/api/auth/register')
      .send({ username: 'newuser', password: '123' });
    expect(res.status).toBe(400);
  });

  test('rejects missing fields', async () => {
    const res = await supertest(getApp())
      .post('/api/auth/register')
      .send({ username: 'nopassword' });
    expect(res.status).toBe(400);
  });

  test('registers a second player', async () => {
    const res = await supertest(getApp())
      .post('/api/auth/register')
      .send({ username: 'player1', password: 'password1', character_name: 'Aragorn' });
    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe('player1');
  });
});

describe('Auth — login', () => {
  test('logs in with correct credentials', async () => {
    const res = await supertest(getApp())
      .post('/api/auth/login')
      .send({ username: 'gm', password: 'password1' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.username).toBe('gm');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  test('rejects wrong password', async () => {
    const res = await supertest(getApp())
      .post('/api/auth/login')
      .send({ username: 'gm', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  test('rejects unknown user', async () => {
    const res = await supertest(getApp())
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'password1' });
    expect(res.status).toBe(401);
  });
});

describe('Auth — /me', () => {
  let token;

  beforeAll(async () => {
    const res = await supertest(getApp())
      .post('/api/auth/login')
      .send({ username: 'gm', password: 'password1' });
    token = res.body.token;
  });

  test('returns current user with valid token', async () => {
    const res = await supertest(getApp())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('gm');
  });

  test('rejects missing token', async () => {
    const res = await supertest(getApp()).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('rejects invalid token', async () => {
    const res = await supertest(getApp())
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
});
