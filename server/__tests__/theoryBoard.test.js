/**
 * Theory board — campaign-scoped shared nodes & edges
 */
const { setup, teardown, createUser, authed } = require('./helpers');

let gm, player1, player2;
let campaignId;

beforeAll(async () => {
  await setup();
  gm = await createUser('gm', 'password1', true);
  player1 = await createUser('player1', 'password1');
  player2 = await createUser('player2', 'password1');
  const campRes = await authed(gm.token).post('/api/campaigns').send({ name: 'Theory Test Campaign' });
  campaignId = campRes.body.campaign.id;
  await authed(gm.token).post(`/api/campaigns/${campaignId}/activate`);
});
afterAll(() => teardown());

const header = () => ({ 'x-campaign-id': String(campaignId) });

describe('Theory board — nodes', () => {
  let nodeId;

  test('player1 creates a theory node', async () => {
    const res = await authed(player1.token)
      .post('/api/theory/nodes')
      .set(header())
      .send({ label: 'Strahd is the killer', type: 'theory', color: '#e74c3c' });
    expect(res.status).toBe(201);
    expect(res.body.node.label).toBe('Strahd is the killer');
    nodeId = res.body.node.id;
  });

  test('player2 can see player1 node (campaign-shared)', async () => {
    const res = await authed(player2.token)
      .get('/api/theory')
      .set(header());
    expect(res.status).toBe(200);
    const found = res.body.nodes.find(n => n.id === nodeId);
    expect(found).toBeTruthy();
  });

  test('player1 can update their own node', async () => {
    const res = await authed(player1.token)
      .put(`/api/theory/nodes/${nodeId}`)
      .set(header())
      .send({ label: 'Strahd is definitely the killer', color: '#c0392b' });
    expect(res.status).toBe(200);
  });

  test('player2 cannot update player1 node', async () => {
    const res = await authed(player2.token)
      .put(`/api/theory/nodes/${nodeId}`)
      .send({ label: 'Trying to edit' });
    expect([403, 404]).toContain(res.status);
  });

  test('GM can update any node', async () => {
    const res = await authed(gm.token)
      .put(`/api/theory/nodes/${nodeId}`)
      .send({ label: 'GM edited this' });
    expect(res.status).toBe(200);
  });
});

describe('Theory board — edges', () => {
  let nodeA, nodeB, edgeId;

  beforeAll(async () => {
    const a = await authed(player1.token).post('/api/theory/nodes').set(header()).send({ label: 'Node A', type: 'clue' });
    const b = await authed(player1.token).post('/api/theory/nodes').set(header()).send({ label: 'Node B', type: 'clue' });
    nodeA = a.body.node.id;
    nodeB = b.body.node.id;
  });

  test('player creates an edge between two nodes', async () => {
    const res = await authed(player1.token)
      .post('/api/theory/edges')
      .set(header())
      .send({ source_id: nodeA, target_id: nodeB, label: 'connected to' });
    expect(res.status).toBe(201);
    edgeId = res.body.edge.id;
  });

  test('edge appears in theory board data', async () => {
    const res = await authed(player2.token).get('/api/theory').set(header());
    expect(res.status).toBe(200);
    const found = res.body.edges.find(e => e.id === edgeId);
    expect(found).toBeTruthy();
  });
});
