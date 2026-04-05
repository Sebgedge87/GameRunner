const db = require('better-sqlite3')('c:/Users/sebas/source/repos/GameRunner/server/data/database.sqlite');
console.log(db.prepare(SELECT sql FROM sqlite_master WHERE type='table' AND name='notes').get().sql);
