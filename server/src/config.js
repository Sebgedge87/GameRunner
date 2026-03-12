require('dotenv').config();
const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-please-change',
  vaultPath: path.resolve(process.env.VAULT_PATH || './vault'),
  dbPath: path.resolve(process.env.DB_PATH || './chronicle.db'),
  gmUsername: process.env.GM_USERNAME || 'dungeonmaster',
};
