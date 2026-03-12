require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { port } = require('./config');
const { runMigrations } = require('./db/migrations');
const { startVaultWatcher } = require('./vault/vaultWatcher');

// Routes
const authRoutes = require('./auth/authRoutes');
const notesRoutes = require('./routes/notes');
const messagesRoutes = require('./routes/messages');
const questsRoutes = require('./routes/quests');
const npcsRoutes = require('./routes/npcs');
const locationsRoutes = require('./routes/locations');
const hooksRoutes = require('./routes/hooks');
const mindmapRoutes = require('./routes/mindmap');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Request logger (dev) ───────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/quests', questsRoutes);
app.use('/api/npcs', npcsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/hooks', hooksRoutes);
app.use('/api/mindmap', mindmapRoutes);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'The Chronicle', timestamp: new Date().toISOString() });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Startup ───────────────────────────────────────────────────────────────────
runMigrations();
startVaultWatcher();

app.listen(port, () => {
  console.log(`\n⚔️  The Chronicle API running at http://localhost:${port}`);
  console.log(`📖  Health: http://localhost:${port}/api/health\n`);
});
