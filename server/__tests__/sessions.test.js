/**
 * Tests for sessions, polls, and scheduling
 */
const { setup, teardown, createUser, authed } = require('./helpers');

let gm, player;
let campaignId;

beforeAll(async () => {
  await setup();
  gm = await createUser('gm', 'password1', true);
  player = await createUser('player1', 'password1');
  const campRes = await authed(gm.token).post('/api/campaigns').send({ name: 'Test Campaign', system: 'dnd5e' });
  campaignId = campRes.body.campaign.id;
  await authed(gm.token).post(`/api/campaigns/${campaignId}/activate`);
});
afterAll(() => teardown());

const campHeader = () => ({ 'x-campaign-id': String(campaignId) });

// ── Sessions ────────────────────────────────────────────────────────────────
describe('Sessions', () => {
  let sessionId;

  test('GM creates a session recap', async () => {
    const res = await authed(gm.token)
      .post('/api/sessions')
      .set(campHeader())
      .send({ title: 'Session 1: The Beginning', number: 1, summary: 'The party met.', played_at: '2024-01-15' });
    expect(res.status).toBe(201);
    expect(res.body.session.title).toBe('Session 1: The Beginning');
    sessionId = res.body.session.id;
  });

  test('lists sessions', async () => {
    const res = await authed(player.token).get('/api/sessions').set(campHeader());
    expect(res.status).toBe(200);
    expect(res.body.sessions.length).toBeGreaterThan(0);
  });

  test('player adds a session note', async () => {
    const res = await authed(player.token)
      .post(`/api/sessions/${sessionId}/notes`)
      .send({ body: 'I took many notes', privacy: 'private' });
    expect(res.status).toBe(201);
    expect(res.body.note.body).toBe('I took many notes');
  });
});

// ── Polls ────────────────────────────────────────────────────────────────────
describe('Polls', () => {
  let pollId;

  test('GM creates a poll with visible results', async () => {
    const res = await authed(gm.token)
      .post('/api/sessions/polls')
      .set(campHeader())
      .send({
        question: 'Which session time works best?',
        options: ['Saturday 7pm', 'Sunday 3pm', 'Friday 8pm'],
        results_public: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.poll.question).toBe('Which session time works best?');
    expect(res.body.poll.results_public).toBe(1);
    pollId = res.body.poll.id;
  });

  test('GM creates a poll with hidden results', async () => {
    const res = await authed(gm.token)
      .post('/api/sessions/polls')
      .set(campHeader())
      .send({
        question: 'Secret vote?',
        options: ['Yes', 'No'],
        results_public: false,
      });
    expect(res.status).toBe(201);
    expect(res.body.poll.results_public).toBe(0);
  });

  test('rejects poll with no options', async () => {
    const res = await authed(gm.token)
      .post('/api/sessions/polls')
      .send({ question: 'Missing options' });
    expect(res.status).toBe(400);
  });

  test('player cannot create a poll', async () => {
    const res = await authed(player.token)
      .post('/api/sessions/polls')
      .send({ question: 'Can I?', options: ['Yes', 'No'] });
    expect(res.status).toBe(403);
  });

  test('lists polls', async () => {
    const res = await authed(player.token).get('/api/sessions/polls');
    expect(res.status).toBe(200);
    expect(res.body.polls.length).toBeGreaterThan(0);
  });

  test('player votes on a poll', async () => {
    const res = await authed(player.token)
      .post(`/api/sessions/polls/${pollId}/vote`)
      .send({ option_index: 0 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('vote is idempotent (re-voting updates choice)', async () => {
    const res = await authed(player.token)
      .post(`/api/sessions/polls/${pollId}/vote`)
      .send({ option_index: 1 });
    expect(res.status).toBe(200);
  });

  test('GM reveals poll results', async () => {
    const res = await authed(gm.token)
      .put(`/api/sessions/polls/${pollId}/reveal`);
    expect(res.status).toBe(200);
  });

  test('GM closes poll', async () => {
    const res = await authed(gm.token)
      .put(`/api/sessions/polls/${pollId}/close`);
    expect(res.status).toBe(200);
  });

  test('GM deletes poll', async () => {
    const res = await authed(gm.token)
      .delete(`/api/sessions/polls/${pollId}`);
    expect(res.status).toBe(200);
  });
});

// ── Scheduling ───────────────────────────────────────────────────────────────
describe('Scheduling', () => {
  let schedId;

  test('GM proposes a session date', async () => {
    const res = await authed(gm.token)
      .post('/api/sessions/scheduling')
      .set(campHeader())
      .send({ proposed_date: '2024-03-15T19:00:00', title: 'Session 2' });
    expect(res.status).toBe(201);
    expect(res.body.date.proposed_date).toBeTruthy();
    schedId = res.body.date.id;
  });

  test('lists scheduling', async () => {
    const res = await authed(player.token).get('/api/sessions/scheduling');
    expect(res.status).toBe(200);
    expect(res.body.scheduling.length).toBeGreaterThan(0);
  });

  test('player responds to scheduling', async () => {
    const res = await authed(player.token)
      .post(`/api/sessions/scheduling/${schedId}/respond`)
      .send({ availability: 'yes' });
    expect(res.status).toBe(200);
  });

  test('player responds with maybe', async () => {
    const res = await authed(player.token)
      .post(`/api/sessions/scheduling/${schedId}/respond`)
      .send({ availability: 'maybe' });
    expect(res.status).toBe(200);
  });

  test('rejects invalid availability', async () => {
    const res = await authed(player.token)
      .post(`/api/sessions/scheduling/${schedId}/respond`)
      .send({ availability: 'whenever' });
    expect(res.status).toBe(400);
  });

  test('GM confirms scheduling', async () => {
    const res = await authed(gm.token)
      .put(`/api/sessions/scheduling/${schedId}/confirm`);
    expect(res.status).toBe(200);
  });
});
