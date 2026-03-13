/**
 * In-memory SSE client registry + notification helpers.
 * Key: userId (number) or 'all' for broadcast.
 */
const clients = new Map(); // userId → Set of res objects

function addClient(userId, res) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
}

function removeClient(userId, res) {
  if (clients.has(userId)) {
    clients.get(userId).delete(res);
    if (!clients.get(userId).size) clients.delete(userId);
  }
}

/**
 * Send an SSE event to one or all users.
 * @param {number|'all'} userId
 * @param {object} payload
 */
function broadcastSSE(userId, payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  if (userId === 'all') {
    for (const set of clients.values()) {
      for (const res of set) { try { res.write(data); } catch (_) {} }
    }
  } else {
    const set = clients.get(userId);
    if (set) {
      for (const res of set) { try { res.write(data); } catch (_) {} }
    }
  }
}

/**
 * Insert a notification row and push an SSE event.
 */
function createNotification(db, userId, type, title, body = '', link = '') {
  try {
    const result = db.prepare(`
      INSERT INTO notifications (user_id, type, title, body, link)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, type, title, body, link);
    broadcastSSE(userId, { type: 'notification', id: result.lastInsertRowid, notif_type: type, title, body, link });
  } catch (e) {
    console.error('[notifications] failed to create:', e.message);
  }
}

module.exports = { addClient, removeClient, broadcastSSE, createNotification };
