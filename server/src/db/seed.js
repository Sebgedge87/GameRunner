const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { getDb } = require('./database');
const { runMigrations } = require('./migrations');
const { vaultPath } = require('../config');

runMigrations();
const db = getDb();

// ── Users ─────────────────────────────────────────────────────────────────────

const SALT_ROUNDS = 10;

const users = [
  { username: 'dm', password: 'dm-secret', character_name: 'The Dungeon Master', character_class: null, character_level: null, role: 'gm' },
  { username: 'aerindel', password: 'player1', character_name: 'Aerindel', character_class: 'Ranger', character_level: 5, role: 'player' },
  { username: 'thorin', password: 'player2', character_name: 'Thorin Ironforge', character_class: 'Fighter', character_level: 5, role: 'player' },
  { username: 'seraphine', password: 'player3', character_name: 'Seraphine Valdris', character_class: 'Cleric', character_level: 5, role: 'player' },
  { username: 'zyx', password: 'player4', character_name: "Zyx'ara", character_class: 'Rogue', character_level: 5, role: 'player' },
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (username, password_hash, character_name, character_class, character_level, role)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const u of users) {
  const hash = bcrypt.hashSync(u.password, SALT_ROUNDS);
  insertUser.run(u.username, hash, u.character_name, u.character_class, u.character_level, u.role);
}
console.log('✅ Users seeded.');

// ── Vault files ───────────────────────────────────────────────────────────────

function writeVaultFile(relPath, content) {
  const fullPath = path.join(vaultPath, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

// Quests
writeVaultFile('Quests/the-missing-merchant.md', `---
title: "The Missing Merchant of Baldur's Gate"
type: main
status: active
progress: 65
location: "Baldur's Gate — Lower City"
started_session: 4
connected_to: [Lord Vayne Theron, Aldric Voss, Zhentarim]
---

A prominent merchant named Aldric Voss vanished without a trace three days before the party arrived in Baldur's Gate. His family has offered a reward for information.

Investigation has revealed he was carrying sealed letters for the City Council — and his ring bore a Zhentarim insignia.
`);

writeVaultFile('Quests/whispering-ruins.md', `---
title: Investigate the Whispering Ruins
type: side
status: active
progress: 20
location: "East of Baldur's Gate — 1 day travel"
started_session: 6
connected_to: [The Pale Lady, Warehouse Row]
---

Locals report strange lights and whispered voices at an abandoned ruin east of the city. A shepherd went missing last week near the site.

The party has not yet investigated.
`);

writeVaultFile('Quests/sealed-letter.md', `---
title: Deliver the Sealed Letter
type: delivery
status: active
progress: 40
location: Candlekeep
started_session: 5
connected_to: [Brother Cedric, Candlekeep]
---

Brother Cedric entrusted the party with a sealed letter to be delivered to a scholar at Candlekeep. He was insistent it not be opened.
`);

console.log('✅ Quest vault files written.');

// NPCs
const npcs = [
  ['NPCs/mira-ashvale.md', `---
title: Mira Ashvale
role: Tavern Keeper
location: The Rusty Flagon
disposition: friendly
faction: Independent
connected_to: [The Rusty Flagon, Aldric Voss, Informant]
---

Owner and barkeep of The Rusty Flagon. Friendly, gossipy, and sharp-eyed. Has lived in the Lower City her whole life and knows everyone's business.

She's been asking quiet questions about Aldric's disappearance since before the party arrived.
`],
  ['NPCs/lord-vayne-theron.md', `---
title: Lord Vayne Theron
role: Merchant Lord
location: "Baldur's Gate — Upper City"
disposition: hostile
faction: City Council
connected_to: [City Council, Zhentarim, Aldric Voss]
---

A powerful and ruthless merchant lord sitting on the City Council. Publicly devastated by Aldric's disappearance. Privately, was seen leaving the docks the night Aldric vanished.

Suspected of Zhentarim ties.
`],
  ['NPCs/brother-cedric.md', `---
title: Brother Cedric
role: Cleric of Helm
location: Temple District
disposition: friendly
faction: Temple of Helm
connected_to: [Temple of Helm, Sealed Letter, Candlekeep]
---

A soft-spoken cleric with kind eyes and an unnervingly calm demeanor. Approached the party directly after their first night in the city.

He knows more than he lets on, but seems genuinely concerned for the city's safety.
`],
  ['NPCs/aldric-voss.md', `---
title: Aldric Voss
role: Missing Merchant
location: Unknown
disposition: unknown
faction: Zhentarim
connected_to: [Lord Vayne Theron, Mira Ashvale, Zhentarim, The Missing Merchant quest]
---

The missing merchant at the heart of the main quest. A mid-ranking Zhentarim spy operating under merchant cover.

Current status: unknown. Last seen at the docks.
`],
  ['NPCs/the-pale-lady.md', `---
title: The Pale Lady
role: Unknown
location: Whispering Ruins
disposition: unknown
faction: Unknown
connected_to: [Whispering Ruins, Warehouse Row]
---

Locals describe a pale woman in white robes seen near the Whispering Ruins at night. No one has spoken with her directly.

Possibly a ghost, a cultist, or something worse.
`],
  ['NPCs/informant.md', `---
title: "??? Informant"
role: Unknown Contact
location: The Rusty Flagon
disposition: neutral
faction: Unknown
connected_to: [Mira Ashvale, The Rusty Flagon, Zhentarim]
---

Someone has been leaving cryptic notes for the party via Mira. The author has not identified themselves.

The notes have been accurate so far.
`],
];

for (const [relPath, content] of npcs) {
  writeVaultFile(relPath, content);
}
console.log('✅ NPC vault files written.');

// Locations
const locations = [
  ['Locations/baldurs-gate-lower-city.md', `---
title: "Baldur's Gate — Lower City"
status: current
danger: low
visited_session: 1
connected_to: [The Rusty Flagon, Warehouse Row, Temple District, City Docks]
---

The bustling lower district of Baldur's Gate. Crowded, noisy, and full of opportunity. The party's current base of operations.
`],
  ['Locations/the-rusty-flagon.md', `---
title: The Rusty Flagon
status: visited
danger: none
visited_session: 1
connected_to: ["Baldur's Gate — Lower City", Mira Ashvale, Informant]
---

A well-worn tavern in the Lower City. Mira Ashvale's establishment. The party's unofficial headquarters.

Cheap rooms, decent food, excellent information.
`],
  ['Locations/whispering-ruins.md', `---
title: Whispering Ruins
status: unvisited
danger: high
visited_session: null
connected_to: [The Pale Lady, Warehouse Row]
---

Ancient ruins one day east of Baldur's Gate. Locals avoid them. Strange lights visible at night.

Unknown origin — possibly pre-Spellplague.
`],
  ['Locations/candlekeep.md', `---
title: Candlekeep
status: visited
danger: none
visited_session: 3
connected_to: [Sealed Letter, Brother Cedric]
---

The great library fortress south of Baldur's Gate. Home to scholars, sages, and ancient tomes.

The party briefly visited during session 3 to research the ruins.
`],
  ['Locations/warehouse-row.md', `---
title: Warehouse Row
status: visited
danger: medium
visited_session: 5
connected_to: ["Baldur's Gate — Lower City", Zhentarim, Whispering Ruins]
---

A stretch of warehouses along the waterfront. The party discovered a hidden Zhentarim cache here during session 5.

The cache has since been emptied by persons unknown.
`],
  ['Locations/city-docks.md', `---
title: City Docks
status: visited
danger: medium
visited_session: 2
connected_to: ["Baldur's Gate — Lower City", Aldric Voss, Lord Vayne Theron]
---

The busy docks of Baldur's Gate. Lord Vayne was spotted here the night of Aldric's disappearance.

Dock workers are tight-lipped.
`],
];

for (const [relPath, content] of locations) {
  writeVaultFile(relPath, content);
}
console.log('✅ Location vault files written.');

// Hooks
const hooks = [
  ['Hooks/ring-of-zhentarim.md', `---
title: "The Ring Speaks Volumes"
type: clue
status: active
session_delivered: 7
connected_to: [Aldric Voss, Lord Vayne Theron, Zhentarim]
---

Aldric's ring was engraved with the Zhentarim insignia. Someone in the City Council is covering up his disappearance — and it's personal.
`],
  ['Hooks/pale-lady-sighting.md', `---
title: "Shepherd's Warning"
type: mystery
status: active
session_delivered: 6
connected_to: [The Pale Lady, Whispering Ruins]
---

Old Henric the shepherd claims a pale woman in white robes walked into the ruins and never came out. He hasn't slept since.
`],
  ['Hooks/sealed-letter-wax.md', `---
title: "The Wax Doesn't Match"
type: clue
status: active
session_delivered: 5
connected_to: [Brother Cedric, Sealed Letter]
---

The wax seal on Brother Cedric's letter bears the mark of Helm — but the wax colour matches the Zhentarim. Coincidence?
`],
  ['Hooks/informant-note.md', `---
title: "Someone Knows Your Name"
type: intrigue
status: active
session_delivered: 8
connected_to: [Informant, Mira Ashvale]
---

A note was slipped under the party's door at The Rusty Flagon. It named each party member by their real name — not their aliases.

"Stop asking about the merchant or the next disappearance will be one of yours."
`],
  ['Hooks/vayne-at-docks.md', `---
title: "Dockworker's Testimony"
type: clue
status: active
session_delivered: 7
connected_to: [Lord Vayne Theron, City Docks, Aldric Voss]
---

A dockworker — bribed with a night's worth of coin — confirms Lord Vayne boarded a private vessel the night Aldric vanished. He had two guards with him. The vessel left and returned before dawn.
`],
];

for (const [relPath, content] of hooks) {
  writeVaultFile(relPath, content);
}
console.log('✅ Hook vault files written.');

// ── Messages ──────────────────────────────────────────────────────────────────

const dm = db.prepare('SELECT id FROM users WHERE username = ?').get('dm');
const aerindel = db.prepare('SELECT id FROM users WHERE username = ?').get('aerindel');
const thorin = db.prepare('SELECT id FROM users WHERE username = ?').get('thorin');

const insertMsg = db.prepare(`
  INSERT INTO messages (from_user_id, to_user_id, subject, body, is_secret)
  VALUES (?, ?, ?, ?, ?)
`);

// Secret to Aerindel
insertMsg.run(
  dm.id,
  aerindel.id,
  'What you noticed about the ring',
  "You notice the merchant's ring bears the insignia of the Zhentarim — a black network you've heard rumors of but never encountered directly. He wasn't just a missing merchant. He was a spy, and someone in the City Council wanted him gone.\n\nProceed carefully. Lord Vayne Theron was seen leaving the docks the night of the disappearance.",
  1
);

// Secret to Aerindel (second)
insertMsg.run(
  dm.id,
  aerindel.id,
  'Brother Cedric pulls you aside',
  "After the others have settled in for the evening, Brother Cedric catches your arm. His voice drops to a whisper.\n\n\"The letter I gave you — guard it with your life. There are people in this city who would kill to prevent it reaching Candlekeep. I cannot tell you more without putting you in greater danger. Please. Trust no one who wears a Council signet ring.\"",
  1
);

// Party broadcast (not secret)
insertMsg.run(
  thorin.id,
  null,
  'Ruins or north first?',
  'Should we go to the ruins before heading north? I think we need to deal with the Pale Lady before she becomes a bigger problem. The letter can wait a few days. Thoughts?',
  0
);

console.log('✅ Messages seeded.');
console.log('\n🎲 Seed complete! Run: npm run dev');
