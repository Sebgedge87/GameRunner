const express = require('express');
const path = require('path');
const fs = require('fs');
const { requireGm } = require('../auth/authMiddleware');
const { dbPath, vaultPath } = require('../config');

const router = express.Router();

// GET /api/backup — stream a zip of vault + db to GM
router.get('/', requireGm, async (req, res) => {
  try {
    const archiver = require('archiver');
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="chronicle-backup-${ts}.zip"`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(res);

    // Add SQLite DB
    if (fs.existsSync(dbPath)) {
      archive.file(dbPath, { name: 'chronicle.db' });
    }

    // Add vault folder
    if (fs.existsSync(vaultPath)) {
      archive.directory(vaultPath, 'vault');
    }

    // Add uploads folder
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (fs.existsSync(uploadsDir)) {
      archive.directory(uploadsDir, 'uploads');
    }

    await archive.finalize();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Backup failed: ' + err.message });
    }
  }
});

module.exports = router;
