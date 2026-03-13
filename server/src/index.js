require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { port } = require('./config');
const { runMigrations } = require('./db/migrations');
const { startVaultWatcher } = require('./vault/vaultWatcher');
const { addClient, removeClient } = require('./services/notifications');
const { requireAuth } = require('./auth/authMiddleware');

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes = require('./auth/authRoutes');
const notesRoutes = require('./routes/notes');
const messagesRoutes = require('./routes/messages');
const questsRoutes = require('./routes/quests');
const npcsRoutes = require('./routes/npcs');
const locationsRoutes = require('./routes/locations');
const hooksRoutes = require('./routes/hooks');
const mindmapRoutes = require('./routes/mindmap');
const campaignsRoutes = require('./routes/campaigns');
const inventoryRoutes = require('./routes/inventory');
const keyItemsRoutes = require('./routes/keyItems');
const mapsRoutes = require('./routes/maps');
const handoutsRoutes = require('./routes/handouts');
const sessionsRoutes = require('./routes/sessions');
const factionsRoutes = require('./routes/factions');
const timelineRoutes = require('./routes/timeline');
const bestiaryRoutes = require('./routes/bestiary');
const rumoursRoutes = require('./routes/rumours');
const jobsRoutes = require('./routes/jobs');
const combatRoutes = require('./routes/combat');
const characterSheetsRoutes = require('./routes/characterSheets');
const theoryBoardRoutes = require('./routes/theoryBoard');
const notificationsRoutes = require('./routes/notifications');
const usersRoutes = require('./routes/users');
const uploadsRoutes = require('./routes/uploads');
const agendaRoutes = require('./routes/agenda');
const stressRoutes = require('./routes/stress');
const pinsRoutes = require('./routes/pins');
const searchRoutes = require('./routes/search');
const backupRoutes = require('./routes/backup');
const vaultRoutes = require('./routes/vault');
const xpRoutes = require('./routes/xp');
const sharesRoutes = require('./routes/shares');

const app = express();

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── Security headers ───────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // relaxed for single-file HTML portal
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ───────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:3000').split(',').map(s => s.trim());
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Serve the single-file client portal from /client (works standalone without Caddy)
const clientPath = path.join(__dirname, '../../client');
app.use(express.static(clientPath));

// ── Request logger (dev) ───────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── SSE endpoint ──────────────────────────────────────────────────────────────
app.get('/api/events', requireAuth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  addClient(req.user.id, res);

  const ping = setInterval(() => {
    try { res.write(': ping\n\n'); } catch (_) { clearInterval(ping); }
  }, 25000);

  req.on('close', () => {
    clearInterval(ping);
    removeClient(req.user.id, res);
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/quests', questsRoutes);
app.use('/api/npcs', npcsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/hooks', hooksRoutes);
app.use('/api/mindmap', mindmapRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/key-items', keyItemsRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/handouts', handoutsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/factions', factionsRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/bestiary', bestiaryRoutes);
app.use('/api/rumours', rumoursRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/combat', combatRoutes);
app.use('/api/character-sheets', characterSheetsRoutes);
app.use('/api/theory', theoryBoardRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/stress', stressRoutes);
app.use('/api/pins', pinsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/xp', xpRoutes);
app.use('/api/shares', sharesRoutes);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'The Chronicle', timestamp: new Date().toISOString() });
});

// ── Serve client SPA for all non-API routes ───────────────────────────────────
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// ── 404 (API only) ────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Startup ───────────────────────────────────────────────────────────────────
runMigrations();
startVaultWatcher();

app.listen(port, () => {
  console.log(`\n⚔️  The Chronicle API running at http://localhost:${port}`);
  console.log(`📖  Health: http://localhost:${port}/api/health`);
  console.log(`📡  SSE:    http://localhost:${port}/api/events\n`);
});
