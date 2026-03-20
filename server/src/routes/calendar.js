const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { broadcastSSE } = require('../services/notifications');

const router = express.Router();

// ── Default calendar config ────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  eras: [
    { id: 1, name: 'Pre-Dawn Cycle', suffix: 'PDC', start_year: 0, end_year: 400 },
    { id: 2, name: 'Age of Embers',  suffix: 'AE',  start_year: 0, end_year: 1424 },
  ],
  current_era_index: 1,
  current_date: { year: 1320, month: 1, day: 1 },
  days: [
    { name: 'Morndunday',  short: 'Mor', real_day: 'Monday'    },
    { name: 'Twinday',     short: 'Twi', real_day: 'Tuesday'   },
    { name: 'Weddensday',  short: 'Wed', real_day: 'Wednesday' },
    { name: 'Thurisday',   short: 'Thu', real_day: 'Thursday'  },
    { name: 'Freyasday',   short: 'Fre', real_day: 'Friday'    },
    { name: 'Saturnsday',  short: 'Sat', real_day: 'Saturday'  },
    { name: 'Solday',      short: 'Sol', real_day: 'Sunday'    },
  ],
  months: [
    { name: 'Embersfall',   short: 'Emb', real_month: 'January',   days: 31 },
    { name: 'Frostreach',   short: 'Fro', real_month: 'February',  days: 28 },
    { name: 'Thawmere',     short: 'Tha', real_month: 'March',     days: 31 },
    { name: 'Bloomtide',    short: 'Blo', real_month: 'April',     days: 30 },
    { name: 'Brightmantle', short: 'Bri', real_month: 'May',       days: 31 },
    { name: 'Sundrift',     short: 'Sun', real_month: 'June',      days: 30 },
    { name: 'Highsummer',   short: 'Hig', real_month: 'July',      days: 31 },
    { name: 'Ashenveil',    short: 'Ash', real_month: 'August',    days: 31 },
    { name: 'Harvestmoon',  short: 'Har', real_month: 'September', days: 30 },
    { name: 'Deepening',    short: 'Dep', real_month: 'October',   days: 31 },
    { name: 'Gloamtide',    short: 'Glo', real_month: 'November',  days: 30 },
    { name: 'Grimwinter',   short: 'Gri', real_month: 'December',  days: 31 },
  ],
  seasons: [
    { name: 'Winter', months: [0, 1, 11], color: '#7ab3d4', icon: '❄' },
    { name: 'Spring', months: [2, 3, 4],  color: '#72a96a', icon: '🌿' },
    { name: 'Summer', months: [5, 6, 7],  color: '#c9a84c', icon: '☀' },
    { name: 'Autumn', months: [8, 9, 10], color: '#c07a3a', icon: '🍂' },
  ],
  moons: [
    {
      name: 'Lunara',
      cycle_days: 28,
      reference_phase_index: 0,
      reference_date: { year: 1, month: 1, day: 1 },
      color: '#ffffff',
    },
  ],
  weather: {
    Winter: [
      { label: 'Clear & Cold', icon: '🌤', weight: 20 },
      { label: 'Overcast',     icon: '☁',  weight: 25 },
      { label: 'Light Snow',   icon: '🌨', weight: 25 },
      { label: 'Heavy Snow',   icon: '❄',  weight: 15 },
      { label: 'Blizzard',     icon: '🌪', weight: 5  },
      { label: 'Fog',          icon: '🌫', weight: 10 },
    ],
    Spring: [
      { label: 'Clear',         icon: '☀',  weight: 30 },
      { label: 'Cloudy',        icon: '⛅', weight: 25 },
      { label: 'Rain',          icon: '🌧', weight: 25 },
      { label: 'Thunderstorm',  icon: '⛈', weight: 10 },
      { label: 'Fog',           icon: '🌫', weight: 10 },
    ],
    Summer: [
      { label: 'Clear & Hot',   icon: '☀',  weight: 45 },
      { label: 'Partly Cloudy', icon: '⛅', weight: 25 },
      { label: 'Rain',          icon: '🌧', weight: 10 },
      { label: 'Thunderstorm',  icon: '⛈', weight: 15 },
      { label: 'Fog',           icon: '🌫', weight: 5  },
    ],
    Autumn: [
      { label: 'Clear',       icon: '🌤', weight: 20 },
      { label: 'Overcast',    icon: '☁',  weight: 30 },
      { label: 'Rain',        icon: '🌧', weight: 30 },
      { label: 'Heavy Rain',  icon: '⛈', weight: 10 },
      { label: 'Fog',         icon: '🌫', weight: 10 },
    ],
  },
  epoch_weekday: 0,
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getCampaignId(req) {
  return req.headers['x-campaign-id'];
}

function getConfig(db, campaignId) {
  const row = db.prepare('SELECT config FROM campaign_calendars WHERE campaign_id = ?').get(campaignId);
  if (!row) return { ...DEFAULT_CONFIG };
  try { return JSON.parse(row.config); } catch { return { ...DEFAULT_CONFIG }; }
}

function weightedRandom(entries) {
  const total = entries.reduce((s, e) => s + (e.weight || 1), 0);
  let r = Math.random() * total;
  for (const e of entries) {
    r -= (e.weight || 1);
    if (r <= 0) return e;
  }
  return entries[entries.length - 1];
}

function getSeasonForMonth(config, monthIndex0) {
  return config.seasons.find(s => s.months.includes(monthIndex0)) || null;
}

// Total days from year=1, month=1, day=1 (within an era) to the given date
function daysSinceEpoch(config, year, month, day) {
  const yearDays = config.months.reduce((s, m) => s + m.days, 0);
  let total = (year - 1) * yearDays;
  for (let m = 0; m < month - 1; m++) total += config.months[m]?.days || 30;
  total += day - 1;
  return total;
}

function broadcastCalendar(db, campaignId) {
  const members = db.prepare('SELECT user_id FROM campaign_members WHERE campaign_id = ?').all(campaignId);
  const payload = { type: 'calendar_update', campaign_id: Number(campaignId) };
  for (const m of members) broadcastSSE(m.user_id, payload);
}

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/calendar — return config
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const cid = getCampaignId(req);
  if (!cid) return res.status(400).json({ error: 'No campaign' });
  res.json({ config: getConfig(db, cid) });
});

// PUT /api/calendar — save config (GM only)
router.put('/', requireAuth, requireGm, (req, res) => {
  const db = getDb();
  const cid = getCampaignId(req);
  if (!cid) return res.status(400).json({ error: 'No campaign' });
  const config = req.body.config;
  if (!config) return res.status(400).json({ error: 'config required' });
  db.prepare(`
    INSERT INTO campaign_calendars (campaign_id, config, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(campaign_id) DO UPDATE SET config = excluded.config, updated_at = CURRENT_TIMESTAMP
  `).run(cid, JSON.stringify(config));
  res.json({ config });
});

// GET /api/calendar/events?year=&month=&era_index= — events for a month
router.get('/events', requireAuth, (req, res) => {
  const db = getDb();
  const cid = getCampaignId(req);
  if (!cid) return res.status(400).json({ error: 'No campaign' });
  const { year, month, era_index } = req.query;
  const isGm = req.user?.role === 'gm';

  let sql = 'SELECT * FROM calendar_events WHERE campaign_id = ? AND era_index = ? AND year = ? AND month = ?';
  const params = [cid, era_index ?? 0, year, month];
  if (!isGm) { sql += ' AND is_gm_only = 0'; }
  sql += ' ORDER BY day ASC';

  const events = db.prepare(sql).all(...params);
  res.json({ events });
});

// POST /api/calendar/events — create event (GM only)
router.post('/events', requireAuth, requireGm, (req, res) => {
  const db = getDb();
  const cid = getCampaignId(req);
  if (!cid) return res.status(400).json({ error: 'No campaign' });
  const { era_index = 0, year, month, day, title, description, type = 'event', color = '#c9a84c', weather_icon, is_gm_only = 0 } = req.body;
  const r = db.prepare(`
    INSERT INTO calendar_events (campaign_id, era_index, year, month, day, title, description, type, color, weather_icon, is_gm_only, created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(cid, era_index, year, month, day, title, description, type, color, weather_icon, is_gm_only ? 1 : 0, req.user.id);
  const ev = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(r.lastInsertRowid);
  broadcastCalendar(db, cid);
  res.json({ event: ev });
});

// PUT /api/calendar/events/:id — update event (GM only)
router.put('/events/:id', requireAuth, requireGm, (req, res) => {
  const db = getDb();
  const cid = getCampaignId(req);
  const { title, description, type, color, weather_icon, is_gm_only, day, month, year, era_index } = req.body;
  db.prepare(`
    UPDATE calendar_events
    SET title=COALESCE(?,title), description=COALESCE(?,description), type=COALESCE(?,type),
        color=COALESCE(?,color), weather_icon=COALESCE(?,weather_icon),
        is_gm_only=COALESCE(?,is_gm_only), day=COALESCE(?,day),
        month=COALESCE(?,month), year=COALESCE(?,year), era_index=COALESCE(?,era_index),
        updated_at=CURRENT_TIMESTAMP
    WHERE id=? AND campaign_id=?
  `).run(title, description, type, color, weather_icon, is_gm_only != null ? (is_gm_only ? 1 : 0) : null, day, month, year, era_index, req.params.id, cid);
  const ev = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(req.params.id);
  broadcastCalendar(db, cid);
  res.json({ event: ev });
});

// DELETE /api/calendar/events/:id (GM only)
router.delete('/events/:id', requireAuth, requireGm, (req, res) => {
  const db = getDb();
  const cid = getCampaignId(req);
  db.prepare('DELETE FROM calendar_events WHERE id = ? AND campaign_id = ?').run(req.params.id, cid);
  broadcastCalendar(db, cid);
  res.json({ ok: true });
});

// POST /api/calendar/weather — generate weather for N days starting from a date (GM only)
router.post('/weather', requireAuth, requireGm, (req, res) => {
  const db = getDb();
  const cid = getCampaignId(req);
  if (!cid) return res.status(400).json({ error: 'No campaign' });
  const { start, days = 7, era_index = 0 } = req.body;
  const config = getConfig(db, cid);

  // Delete existing weather events for these days first
  const generated = [];
  let { year, month, day } = start;

  for (let i = 0; i < days; i++) {
    const monthObj = config.months[month - 1];
    const season = getSeasonForMonth(config, month - 1);
    const weatherTable = season ? (config.weather[season.name] || []) : [];

    let weather = null;
    if (weatherTable.length > 0) {
      weather = weightedRandom(weatherTable);
    } else {
      weather = { label: 'Clear', icon: '☀' };
    }

    // Upsert: delete existing weather for this day then insert
    db.prepare(`
      DELETE FROM calendar_events
      WHERE campaign_id=? AND era_index=? AND year=? AND month=? AND day=? AND type='weather'
    `).run(cid, era_index, year, month, day);

    const r = db.prepare(`
      INSERT INTO calendar_events (campaign_id, era_index, year, month, day, title, type, color, weather_icon, is_gm_only, created_by)
      VALUES (?,?,?,?,?,?,?,?,?,0,?)
    `).run(cid, era_index, year, month, day, weather.label, 'weather', '#555', weather.icon, req.user.id);

    generated.push({ year, month, day, weather });

    // Advance day
    day++;
    if (day > (monthObj?.days || 30)) {
      day = 1;
      month++;
      if (month > config.months.length) {
        month = 1;
        year++;
      }
    }
  }

  broadcastCalendar(db, cid);
  res.json({ generated });
});

// PUT /api/calendar/current-date — advance/set the current in-world date (GM only)
router.put('/current-date', requireAuth, requireGm, (req, res) => {
  const db = getDb();
  const cid = getCampaignId(req);
  if (!cid) return res.status(400).json({ error: 'No campaign' });
  const config = getConfig(db, cid);
  config.current_date = req.body.date;
  if (req.body.era_index != null) config.current_era_index = req.body.era_index;
  db.prepare(`
    INSERT INTO campaign_calendars (campaign_id, config, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(campaign_id) DO UPDATE SET config = excluded.config, updated_at = CURRENT_TIMESTAMP
  `).run(cid, JSON.stringify(config));
  broadcastCalendar(db, cid);
  res.json({ config });
});

module.exports = router;
