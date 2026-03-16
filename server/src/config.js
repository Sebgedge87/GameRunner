require('dotenv').config();
const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-please-change',
  vaultPath: path.resolve(process.env.VAULT_PATH || './vault'),
  // DB_PATH defaults to /data/chronicle.db so it can be mounted as a Docker volume.
  // Set DB_PATH in .env to point anywhere (e.g. DB_PATH=/data/chronicle.db).
  dbPath: path.resolve(process.env.DB_PATH || path.join(__dirname, '../../../data/chronicle.db')),
  gmUsername: process.env.GM_USERNAME || 'dungeonmaster',
  // Set REGISTRATION_OPEN=false in .env to prevent new signups (recommended for private groups)
  registrationOpen: process.env.REGISTRATION_OPEN !== 'false',
};
