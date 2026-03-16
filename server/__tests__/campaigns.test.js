const { setup, teardown, createUser, authed } = require('./helpers');

let gm, player;

beforeAll(async () => {
  await setup();
  gm = await createUser('gm', 'password1', true);
  player = await createUser('player1', 'password1');
});
afterAll(() => teardown());

describe('Campaigns — CRUD', () => {
  let campaignId;

  test('GM creates a campaign', async () => {
    const res = await authed(gm.token)
      .post('/api/campaigns')
      .send({ name: 'Curse of Strahd', system: 'dnd5e', subtitle: 'Gothic Horror' });
    expect(res.status).toBe(201);
    expect(res.body.campaign.name).toBe('Curse of Strahd');
    campaignId = res.body.campaign.id;
  });

  test('any authenticated user can create a campaign', async () => {
    const res = await authed(player.token)
      .post('/api/campaigns')
      .send({ name: 'Player Campaign' });
    // Campaign creation is open to all authenticated users (they become GM of their own campaign)
    expect(res.status).toBe(201);
  });

  test('lists campaigns', async () => {
    const res = await authed(gm.token).get('/api/campaigns');
    expect(res.status).toBe(200);
    expect(res.body.campaigns.length).toBeGreaterThan(0);
  });

  test('GM updates a campaign', async () => {
    const res = await authed(gm.token)
      .put(`/api/campaigns/${campaignId}`)
      .send({ subtitle: 'Updated subtitle' });
    expect(res.status).toBe(200);
    expect(res.body.campaign.subtitle).toBe('Updated subtitle');
  });

  test('GM activates the campaign', async () => {
    const res = await authed(gm.token)
      .put(`/api/campaigns/${campaignId}/activate`);
    expect(res.status).toBe(200);
  });
});
