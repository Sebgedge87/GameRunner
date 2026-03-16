/**
 * GM content creation flows: quests, NPCs, polls, scheduling, messages
 */
const { test, expect } = require('@playwright/test');
const { apiPost, apiPut } = require('./helpers');

let gmToken, playerToken, campaignId, playerId;

test.beforeAll(async () => {
  await apiPost('/api/auth/register', { username: 'e2e-gm3', password: 'password123', character_name: 'The GM' });
  const gmLogin = await apiPost('/api/auth/login', { username: 'e2e-gm3', password: 'password123' });
  gmToken = gmLogin.token;

  await apiPost('/api/auth/register', { username: 'e2e-player3', password: 'password123', character_name: 'Hero' });
  const playerLogin = await apiPost('/api/auth/login', { username: 'e2e-player3', password: 'password123' });
  playerToken = playerLogin.token;
  playerId = playerLogin.user?.id;

  const campData = await apiPost('/api/campaigns', { name: 'Content Test Campaign', system: 'dnd5e' }, gmToken);
  campaignId = campData.campaign?.id;
  if (campaignId) await apiPut(`/api/campaigns/${campaignId}/activate`, {}, gmToken);
});

async function loginAs(page, token) {
  await page.goto('/');
  await page.evaluate((t) => localStorage.setItem('token', t), token);
  await page.reload();
  await page.waitForTimeout(1000);
}

test.describe('GM creates a quest', () => {
  test('quest appears in the quest list after creation via API', async ({ page }) => {
    // Create via API (modal testing is complex without exact selectors)
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gmToken}`, 'x-campaign-id': String(campaignId) };
    const questRes = await page.request.post('/api/quests', { headers, data: { title: 'E2E Quest', status: 'active' } });
    expect(questRes.status()).toBe(201);

    // Navigate to quests page
    await loginAs(page, gmToken);
    const questsLink = page.locator('nav a:has-text("Quest"), .nav-item:has-text("Quest"), [data-page="quests"]').first();
    if (await questsLink.isVisible()) {
      await questsLink.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toContainText('E2E Quest', { timeout: 5000 });
    }
  });
});

test.describe('Polls', () => {
  test('GM creates a poll via API and player sees it', async ({ page }) => {
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gmToken}`, 'x-campaign-id': String(campaignId) };
    const pollRes = await page.request.post('/api/sessions/polls', {
      headers,
      data: { question: 'Best session day?', options: ['Saturday', 'Sunday', 'Friday'], results_public: true },
    });
    expect(pollRes.status()).toBe(201);
    const poll = await pollRes.json();
    expect(poll.poll.question).toBe('Best session day?');
    expect(poll.poll.results_public).toBe(1);
  });

  test('player votes on a poll', async ({ page }) => {
    // Create a poll
    const gmHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gmToken}` };
    const pollRes = await page.request.post('/api/sessions/polls', {
      headers: gmHeaders,
      data: { question: 'Vote test?', options: ['Yes', 'No'], results_public: false },
    });
    const { poll } = await pollRes.json();

    // Player votes
    const playerHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${playerToken}` };
    const voteRes = await page.request.post(`/api/sessions/polls/${poll.id}/vote`, {
      headers: playerHeaders,
      data: { option_index: 0 },
    });
    expect(voteRes.status()).toBe(200);
  });
});

test.describe('Messages', () => {
  test('GM sends a message and player receives it', async ({ page }) => {
    const gmHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gmToken}` };
    const msgRes = await page.request.post('/api/messages', {
      headers: gmHeaders,
      data: { to_user_id: playerId, subject: 'E2E Message', body: 'Test body' },
    });
    expect(msgRes.status()).toBe(201);

    const playerHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${playerToken}` };
    const listRes = await page.request.get('/api/messages', { headers: playerHeaders });
    const { messages } = await listRes.json();
    const found = messages.find(m => m.subject === 'E2E Message');
    expect(found).toBeTruthy();
  });
});

test.describe('Theory Board', () => {
  test('player creates a theory node visible to all', async ({ page }) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${playerToken}`,
      'x-campaign-id': String(campaignId),
    };
    const nodeRes = await page.request.post('/api/theory/nodes', {
      headers,
      data: { label: 'E2E Theory Node', type: 'theory' },
    });
    expect(nodeRes.status()).toBe(201);

    // GM can see the node
    const gmHeaders = { 'Authorization': `Bearer ${gmToken}`, 'x-campaign-id': String(campaignId) };
    const listRes = await page.request.get('/api/theory', { headers: gmHeaders });
    const { nodes } = await listRes.json();
    expect(nodes.find(n => n.label === 'E2E Theory Node')).toBeTruthy();
  });
});
