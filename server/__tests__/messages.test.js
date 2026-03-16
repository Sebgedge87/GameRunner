const { setup, teardown, createUser, authed } = require('./helpers');

let gm, player;

beforeAll(async () => {
  await setup();
  gm = await createUser('gm', 'password1', true);
  player = await createUser('player1', 'password1');
});
afterAll(() => teardown());

describe('Messages', () => {
  let msgId;

  test('GM sends a message to player', async () => {
    const res = await authed(gm.token)
      .post('/api/messages')
      .send({
        to_user_id: player.user.id,
        subject: 'Secret Mission',
        body: 'Meet me at the tavern.',
        is_secret: false,
      });
    expect(res.status).toBe(201);
    expect(res.body.message.subject).toBe('Secret Mission');
    msgId = res.body.message.id;
  });

  test('player lists their messages', async () => {
    const res = await authed(player.token).get('/api/messages');
    expect(res.status).toBe(200);
    expect(res.body.messages.length).toBeGreaterThan(0);
    const msg = res.body.messages.find(m => m.id === msgId);
    expect(msg).toBeTruthy();
    expect(msg.subject).toBe('Secret Mission');
  });

  test('player replies to message', async () => {
    const res = await authed(player.token)
      .post('/api/messages')
      .send({
        to_user_id: gm.user.id,
        subject: 'Re: Secret Mission',
        body: 'On my way.',
        reply_to_id: msgId,
      });
    expect(res.status).toBe(201);
    expect(res.body.message.reply_to_id).toBe(msgId);
  });

  test('player can acknowledge message', async () => {
    const res = await authed(player.token)
      .put(`/api/messages/${msgId}/ack`);
    expect(res.status).toBe(200);
  });

  test('GM can delete their sent message', async () => {
    const res = await authed(gm.token).delete(`/api/messages/${msgId}`);
    expect(res.status).toBe(200);
  });

  test('player cannot delete GM message they only received', async () => {
    // Create another message
    const sendRes = await authed(gm.token)
      .post('/api/messages')
      .send({ to_user_id: player.user.id, subject: 'Another', body: 'body' });
    const id = sendRes.body.message.id;
    const res = await authed(player.token).delete(`/api/messages/${id}`);
    expect(res.status).toBe(403);
  });
});
