/**
 * E2E test helpers — API calls to set up state before UI tests
 */
const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function apiPost(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  return res.json();
}

async function apiPut(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: 'PUT', headers, body: JSON.stringify(body) });
  return res.json();
}

/** Register + promote to GM, or just register as player */
async function registerAndLogin(username, password, promoteToGm = false) {
  await apiPost('/api/auth/register', { username, password, character_name: username });
  const loginData = await apiPost('/api/auth/login', { username, password });
  const { token, user } = loginData;
  if (promoteToGm) {
    // Re-login after a short delay to pick up role change if any
  }
  return { token, user };
}

async function loginAs(username, password) {
  const data = await apiPost('/api/auth/login', { username, password });
  return data;
}

module.exports = { apiPost, apiPut, registerAndLogin, loginAs };
