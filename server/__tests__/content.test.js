/**
 * Tests for core content routes: quests, NPCs, locations, hooks
 */
const { setup, teardown, createUser, authed } = require('./helpers');

let gm, player;
let campaignId;

beforeAll(async () => {
  await setup();
  gm = await createUser('gm', 'password1', true);
  player = await createUser('player1', 'password1');
  // Create and activate a campaign
  const campRes = await authed(gm.token).post('/api/campaigns').send({ name: 'Test Campaign', system: 'dnd5e' });
  campaignId = campRes.body.campaign.id;
  await authed(gm.token).post(`/api/campaigns/${campaignId}/activate`);
});
afterAll(() => teardown());

const campHeader = () => ({ 'x-campaign-id': String(campaignId) });

// ── Quests ──────────────────────────────────────────────────────────────────
describe('Quests', () => {
  let questId;

  test('GM creates a quest', async () => {
    const res = await authed(gm.token)
      .post('/api/quests')
      .set(campHeader())
      .send({ title: 'Recover the Artifact', description: 'Find the lost relic.', status: 'active' });
    expect(res.status).toBe(201);
    expect(res.body.quest.title).toBe('Recover the Artifact');
    questId = res.body.quest.id;
  });

  test('player cannot create a quest', async () => {
    const res = await authed(player.token)
      .post('/api/quests')
      .set(campHeader())
      .send({ title: 'Player Quest' });
    expect(res.status).toBe(403);
  });

  test('lists quests', async () => {
    const res = await authed(player.token).get('/api/quests').set(campHeader());
    expect(res.status).toBe(200);
    expect(res.body.quests.length).toBeGreaterThan(0);
  });

  test('GM updates a quest', async () => {
    const res = await authed(gm.token)
      .put(`/api/quests/${questId}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(200);
    // Quest PUT returns { success: true } — the update is applied via vault file rewrite
    expect(res.body.success).toBe(true);
  });

  test('GM deletes a quest', async () => {
    const res = await authed(gm.token).delete(`/api/quests/${questId}`);
    expect(res.status).toBe(200);
  });
});

// ── NPCs ────────────────────────────────────────────────────────────────────
describe('NPCs', () => {
  let npcId;

  test('GM creates an NPC', async () => {
    const res = await authed(gm.token)
      .post('/api/npcs')
      .set(campHeader())
      .send({ name: 'Strahd von Zarovich', role: 'Villain', description: 'Ancient vampire lord.' });
    expect(res.status).toBe(201);
    // NPC title comes from frontmatter; response has .title not .name
    expect(res.body.npc.title).toBe('Strahd von Zarovich');
    npcId = res.body.npc.id;
  });

  test('lists NPCs', async () => {
    const res = await authed(player.token).get('/api/npcs').set(campHeader());
    expect(res.status).toBe(200);
    expect(res.body.npcs.length).toBeGreaterThan(0);
  });

  test('GM updates an NPC', async () => {
    const res = await authed(gm.token)
      .put(`/api/npcs/${npcId}`)
      .send({ role: 'Main Villain' });
    expect(res.status).toBe(200);
    // NPC PUT rewrites vault file; returns { success: true }
    expect(res.body.success).toBe(true);
  });
});

// ── Locations ───────────────────────────────────────────────────────────────
describe('Locations', () => {
  let locationId;

  test('GM creates a location', async () => {
    const res = await authed(gm.token)
      .post('/api/locations')
      .set(campHeader())
      .send({ title: 'Castle Ravenloft', description: 'Foreboding fortress.' });
    expect(res.status).toBe(201);
    // Location title stored in frontmatter/vault_files.title
    expect(res.body.location.title).toBeTruthy();
    locationId = res.body.location.id;
  });

  test('lists locations', async () => {
    const res = await authed(player.token).get('/api/locations').set(campHeader());
    expect(res.status).toBe(200);
    expect(res.body.locations.length).toBeGreaterThan(0);
  });

  test('GM deletes a location', async () => {
    const res = await authed(gm.token).delete(`/api/locations/${locationId}`);
    expect(res.status).toBe(200);
  });
});

// ── Hooks ────────────────────────────────────────────────────────────────────
describe('Hooks', () => {
  let hookId;

  test('GM creates a hook', async () => {
    const res = await authed(gm.token)
      .post('/api/hooks')
      .set(campHeader())
      .send({ title: 'Strange lights in the forest', description: 'Mysterious lights spotted.' });
    expect(res.status).toBe(201);
    hookId = res.body.hook.id;
  });

  test('lists hooks', async () => {
    const res = await authed(player.token).get('/api/hooks').set(campHeader());
    expect(res.status).toBe(200);
    expect(res.body.hooks.length).toBeGreaterThan(0);
  });
});
