/**
 * Privacy rules for notes — enforced server-side.
 *
 * Player requests: own notes + public notes from others.
 * GM requests: public notes + notes where shared_with_gm = true.
 *
 * NEVER expose:
 *   - private notes belonging to another player (to any player)
 *   - notes with shared_with_gm = false (to the GM)
 *   - secret messages to anyone other than the specific recipient
 */

function buildNoteFilter(user) {
  if (user.role === 'gm') {
    // GM sees: public notes OR notes explicitly shared with GM
    return `(privacy = 'public' OR shared_with_gm = 1)`;
  }
  // Player sees: their own notes OR public notes from anyone
  return `(player_id = ${user.id} OR privacy = 'public')`;
}

/**
 * Filter an array of note objects in memory (for notes fetched from vault).
 * Used when the source is the vault rather than SQLite.
 */
function filterNotes(notes, user) {
  return notes.filter((note) => {
    const fm = note.data || {};
    if (user.role === 'gm') {
      return fm.privacy === 'public' || fm.shared_with_gm === true;
    }
    // Player: own note or public
    return fm.player === user.character_name || fm.privacy === 'public';
  });
}

/**
 * Filter messages for the requesting user.
 * - Broadcast messages (to_user_id = NULL) are visible to all.
 * - Secret messages only to their specific recipient.
 */
function filterMessages(messages, user) {
  return messages.filter((msg) => {
    if (msg.to_user_id === null) return true;           // broadcast
    if (msg.to_user_id === user.id) return true;        // directly addressed
    if (msg.from_user_id === user.id && !msg.is_secret) return true; // sent by me, not secret
    return false;
  });
}

module.exports = { buildNoteFilter, filterNotes, filterMessages };
