/**
 * Minimal TOTP implementation (RFC 6238) using Node.js built-in crypto.
 * Uses HMAC-SHA1, 30-second window, 6-digit codes.
 */
const crypto = require('crypto');

/**
 * Generate a random base32 secret (20 bytes = 160 bits).
 */
function generateSecret() {
  const bytes = crypto.randomBytes(20);
  return base32Encode(bytes);
}

/**
 * Compute a TOTP code for the given secret and time step.
 * @param {string} secret Base32-encoded secret
 * @param {number} [t] Unix time in seconds (defaults to now)
 * @returns {string} 6-digit code
 */
function generateCode(secret, t = Math.floor(Date.now() / 1000)) {
  const counter = Math.floor(t / 30);
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) { buf[i] = c & 0xff; c = Math.floor(c / 256); }
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[19] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(code % 1000000).padStart(6, '0');
}

/**
 * Verify a TOTP code, accepting ±1 time step (90 second window).
 */
function verifyCode(secret, token) {
  const now = Math.floor(Date.now() / 1000);
  for (const delta of [-1, 0, 1]) {
    if (generateCode(secret, now + delta * 30) === String(token).trim()) return true;
  }
  return false;
}

/**
 * Build an otpauth:// URI for QR code generation.
 */
function buildOtpAuthUri(secret, username, issuer = 'TheChronicle') {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(username)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// ── Base32 helpers ─────────────────────────────────────────────────────────────
const B32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf) {
  let bits = 0, val = 0, out = '';
  for (const byte of buf) {
    val = (val << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32_CHARS[(val >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_CHARS[(val << (5 - bits)) & 31];
  return out;
}

function base32Decode(str) {
  const s = str.replace(/=+$/, '').toUpperCase();
  const bytes = [];
  let bits = 0, val = 0;
  for (const ch of s) {
    const idx = B32_CHARS.indexOf(ch);
    if (idx < 0) continue;
    val = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) { bytes.push((val >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(bytes);
}

module.exports = { generateSecret, generateCode, verifyCode, buildOtpAuthUri };
