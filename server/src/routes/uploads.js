const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { uploadsPath } = require('../config');

const UPLOAD_DIR = uploadsPath;
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const ALLOWED_EXTS = /\.(jpg|jpeg|png|gif|webp|pdf|mp3|ogg|wav)$/i;
const ALLOWED_MIMES = new Set([
  'image/jpeg','image/png','image/gif','image/webp',
  'application/pdf','audio/mpeg','audio/ogg','audio/wav','audio/wave',
]);

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_EXTS.test(file.originalname) || !ALLOWED_MIMES.has(file.mimetype)) {
      return cb(new Error('File type not allowed'));
    }
    cb(null, true);
  },
});

const router = express.Router();

router.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename, originalname: req.file.originalname, mimetype: req.file.mimetype });
});

module.exports = router;
