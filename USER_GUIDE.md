# GameRunner — User Guide

A complete reference for everything you can do in the app, organised by role.

---

## Getting In

### Register
Go to the app URL → click **Register** → enter a username and password. Registration is open by default; the GM can close it after everyone has signed up.

### Login
Enter your username and password → **Enter the Chronicle**. Your session is saved in the browser — you stay logged in until you explicitly log out.

### Logout
Click your username in the top-right corner → **Logout**.

---

## The Interface

```
┌─────────────────────────────────────────────────────────┐
│  [Campaign ▼]   [🔍 Search]   [🎵] [✉️ 2] [🔔 3]  [☰] │  ← Topbar
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ Sidebar  │              Main Content                   │
│          │                                              │
│ Campaign │                                              │
│  Dashboard│                                             │
│  Quests  │                                              │
│  Job Board│                                             │
│          │                                              │
│ World    │                                              │
│  NPCs    │                                              │
│  Locations│                                             │
│  Hooks   │                                              │
│  Factions│                                              │
│  Timeline│                                              │
│  Maps    │                                              │
│  Mindmap │                                              │
│          │                                              │
│ Players  │                                              │
│  Handouts│                                              │
│  Inventory│                                             │
│  Bestiary│                                              │
│  Rumours │                                              │
│  Sessions│                                              │
│          │                                              │
│ Character│                                              │
│  Sheet   │                                              │
│  Notes   │                                              │
│  Theory  │                                              │
│          │                                              │
│ ── GM ── │                                              │
│  Dashboard│                                             │
│  Combat  │                                              │
└──────────┴──────────────────────────────────────────────┘
```

---

## Themes

Click the palette icon in the topbar to switch the visual theme. Each theme changes colours, fonts, and textures to match the game system:

| Theme | Aesthetic |
|---|---|
| D&D 5e | Gold/brown fantasy (default) |
| Call of Cthulhu | Noir/vintage with paper texture |
| Alien | Green monochrome with CRT scanlines |
| Coriolis | Dark blue space opera |
| Dune | Sand and gold desert |
| Achtung! Cthulhu | Military green |

---

## Global Search

Click the search bar in the topbar (or press **⌘K / Ctrl+K**) and start typing. Results appear instantly across quests, NPCs, locations, hooks, and more. Click a result to jump to it.

---

## Dashboard

The landing page when you log in.

| Element | What it shows |
|---|---|
| Campaign banner | Campaign name, current scene, weather, in-world time, music |
| Agenda card | Your secret objective (player-only; locked until GM reveals it) |
| Stats row | Total quests · active quests · NPC count · open hooks |
| Active quests | Top 5 quests with progress bars |
| Recent messages | Latest messages from the GM or other players |
| Next session | Scheduled date and RSVP status |
| Pinned items | Any item you or the GM has pinned for quick access |

---

## Quests

A list of all quests in the campaign.

**Players can:**
- Browse quests and filter by status (All / Active / Completed / Failed)
- Read quest details, linked locations, and connections
- Pin a quest to the dashboard (📌 button)

**GMs can also:**
- **Create** a quest — title, description, status, and type (Main / Side / Personal)
- **Edit** or **Delete** any quest
- **Hide / Show** a quest from players (👁 button)
- **Share** a hidden quest with specific players (share button)
- Set status to Active, Completed, or Failed

---

## Job Board

Contracts, bounties, and odd jobs available to the party.

**Players can:**
- Browse jobs with difficulty, reward, and location
- See who posted the job (NPC)

**GMs can also:**
- **Post** a job — title, description, reward, difficulty, posting NPC, location
- **Edit** or **Delete** a job
- **Promote** a job directly into a Quest
- **Hide / Show** jobs

---

## NPCs

All non-player characters the party has encountered or heard of.

**Players can:**
- Browse and search NPC cards
- View disposition (Friendly / Neutral / Hostile), role, and description
- See connected locations and faction affiliations

**GMs can also:**
- **Create** an NPC — name, role, description, image upload, GM-only notes
- **Edit** or **Delete** an NPC
- Add hidden GM notes visible only to the GM
- **Hide / Show** NPC cards from players

---

## Locations

Places in the world — cities, dungeons, shops, wilderness areas.

**Players can:**
- Browse location cards
- See visit status (Visited / Unvisited) and danger level
- View connected NPCs and quests

**GMs can also:**
- **Create** a location — name, description, image upload
- **Edit** or **Delete** a location
- Set danger level
- **Hide / Show** locations

---

## Story Hooks

Clues, rumours, and mysteries that might lead somewhere.

**Players can:**
- Browse hooks by type (Clue / Mystery / Theory) and status

**GMs can also:**
- **Create** a hook — title, description, type, status (Active / Resolved / Hidden)
- **Edit** or **Delete**
- **Hide / Show**

---

## Factions

Organisations, guilds, cults, and power groups in the world.

**Players can:**
- View faction cards with goals, known members, and the party's reputation score
- See reputation fill bars (visual indicator of standing)

**GMs can also:**
- **Create** a faction — name, description, goals, members
- **Edit** or **Delete**
- Adjust reputation values per faction
- **Hide / Show** factions

---

## Timeline

A chronological record of events in the campaign world.

**Players can:**
- View events in order with in-world dates

**GMs can also:**
- **Create** an event — title, in-world date, description, linked quest
- **Edit** or **Delete**
- **Hide / Show** events

---

## Maps

Images of regions, cities, dungeons, and encounter zones.

**Players can:**
- Browse map thumbnails
- Click to view a map full-screen

**GMs can also:**
- **Upload** a map image (JPG / PNG / WebP, max 20 MB)
- Set type (World / Region / City / Dungeon / Encounter)
- **Edit** title and description
- **Delete** a map
- **Hide / Show** maps from players

---

## Mindmap

An interactive visual graph that shows how everything in the campaign connects.

- Nodes are colour-coded: Quest (gold) · NPC (blue) · Location (green) · Hook (purple)
- **Drag** nodes to rearrange the layout
- **Click** a node to open its detail panel
- No editing is done here — it reflects the current state of all campaign content

---

## Handouts

Documents, letters, images, and notes passed from the GM to players.

**Players can:**
- Read handouts sent to them or to all players
- **Acknowledge** a handout if the GM requires confirmation
- **Reshare** a handout with another player (if the GM allowed it)

**GMs can also:**
- **Create** a handout — title, body text, image, target (one player or all)
- Require acknowledgment (tracks who has read it)
- Allow or disallow player resharing
- **Edit** or **Delete** handouts

---

## Inventory

Items carried by the party.

### Party Inventory
**Players can:**
- View item name, quantity, who's holding it, and description

**GMs can also:**
- **Add** an item — name, quantity, holder, description
- **Edit** or **Delete** items
- **Hide / Show** items

### Key Items
Story-significant objects (artefacts, quest items, MacGuffins).

- Same create/edit/delete controls as party inventory
- Each key item can be linked to a quest and flagged with its significance
- Can be hidden until the GM reveals them

---

## Bestiary

Creatures the party has encountered.

**Players can:**
- Browse creature cards with CR, AC, HP, and description

**GMs can also:**
- **Add** a creature — name, description, CR, AC, HP, image
- **Edit** or **Delete**
- Toggle **Revealed** status — hidden until the GM reveals it to players

---

## Rumours

Hearsay, gossip, and intel the party has picked up.

**Players can:**
- Read rumours with their source (NPC or location)

**GMs can also:**
- **Create** a rumour — text, source NPC, source location, and whether it's actually true
- **Edit** or **Delete**
- **Expose** a rumour — reveal its truth/falsehood to players

---

## Sessions

A log of past and upcoming game sessions.

**Players can:**
- Read session summaries and notes
- Respond to scheduling polls (Yes / Maybe / No) for upcoming sessions

**GMs can also:**
- **Create** a session entry — title, summary, date
- **Edit** or **Delete**
- View all player scheduling responses
- Add detailed session notes

---

## Character Sheet

Your character's stats, abilities, and features. The layout adapts to the campaign's game system.

**Players:** See their own character sheet.

**GMs:** Use the player selector dropdown to view any player's sheet.

---

## Notes (Personal Journal)

A private notebook — visible only to you unless you choose to share.

**Create a note:**
- Title and body text
- Category: Notes / Clues / Plans / Lore
- Privacy: **Private** (only you) or **Public** (all players)
- Optional: **Share with GM** checkbox

---

## Theory Board

An investigation corkboard — connect facts, NPCs, locations, and theories visually.

**Add a node:**
- Label and type: Theory · Fact · NPC · Location · Question
- Add notes to the node
- Optional: share with GM

**Connect nodes:**
- Click a node to enter connection mode → click another node to draw a link
- Build out the party's investigation web

**GMs** can view any player's theory board via the player selector.

---

## Messages

Click the **✉️** icon in the topbar.

### Sending a message
- Choose recipient: a specific player, or **All Players**
- Subject and body
- **Mark as Secret** — adds a purple badge; contents are hidden from session logs
- **Require Acknowledgment** — recipient must confirm they read it

### Inbox
- Unread messages have a blue left border
- Secret messages have a purple badge
- Click a message to read it in full
- **Acknowledge** button appears if the GM required it

---

## Notifications

Click the **🔔** icon in the topbar. Notifications arrive in real time (no page refresh needed) for:
- New handouts
- New messages
- Session reminders
- GM announcements

Click **Mark all read** to clear the badge.

---

## Pins

Any card with a 📌 button can be pinned. Pinned items appear on the Dashboard for quick access. Click the X on a pin chip to unpin.

---

## Ambient Audio

Click the 🎵 button in the topbar to toggle ambient background audio (if the GM has set a music link for the campaign).

---

---

# GM Reference

Everything above applies to the GM. This section covers GM-only features.

---

## Campaign Switcher

The dropdown in the top-left of the topbar. Switch between campaigns instantly — all players see the newly active campaign immediately.

## Floating Action Button ( + )

A **+** button appears in the bottom-right corner on content pages. Click it to create a new item for the current page. This is the primary way to add content.

---

## GM Dashboard

**GM → Dashboard** in the sidebar.

### Campaign Settings
- Campaign name, system, subtitle, description
- Music URL and label (shown in banner and plays via ambient toggle)
- Theme lock (force all players to a specific theme)
- Save changes

### Player Management
| Action | How |
|---|---|
| View all players | Listed in the table with username, character name |
| Reset a password | Click **Pwd** → enter new password |
| Delete a player | Click **Delete** → confirm |
| View character sheet | Go to Character Sheet page → select player |

### Stress / Sanity / Exhaustion
Per-player tracking fields (which stats appear depends on the campaign system):
- Alien / Coriolis → Stress
- Call of Cthulhu / Achtung! Cthulhu → Sanity
- D&D 5e → Exhaustion
Enter values and save per player.

### XP & Milestones
1. Select one or more players from the list
2. Enter an XP amount and a reason
3. Click **Award XP**
4. The table updates with running totals and current level
5. Expand **Award History** to see the full log; remove individual awards if needed

### Agenda
A secret objective delivered privately to a player:
1. Select target player
2. Enter title and details
3. Save — the player sees a locked "Agenda" card on their dashboard
4. Return here to **Reveal** it when the time is right

### Backup & Export
Click **Download Backup** to get a ZIP containing:
- The SQLite database (`chronicle.db`)
- The entire vault (markdown files)
- All uploaded images

---

## Combat Tracker

**GM → Combat** in the sidebar.

### Starting an encounter
Click **New Encounter** → enter a name.

### Adding combatants
Fill in Name, Initiative, Max HP, and Type (PC / NPC / Monster) → **Add**.

### Running combat
| Button | Effect |
|---|---|
| **Next Round** | Advances the round counter, resets turn order |
| **➕ / ➖** | Heal or damage a combatant (±5 HP default) |
| **Set HP** | Prompt for an exact HP value |
| **End Encounter** | Closes the encounter (asks for confirmation) |

HP bars change colour automatically:
- Green → above 50%
- Yellow → 25–50%
- Red → below 25%

### Visibility
Players can see the combat tracker when the GM has it open. Combatant names, HP bars, and conditions are shown — GMs control what detail is visible.

---

## Show / Hide & Sharing

Every content item has visibility controls (GM only):

| Control | What it does |
|---|---|
| 👁 **Show** | Makes the item visible to all players |
| 🚫 **Hide** | Hides it from all players |
| **Share** button | Opens a player list — tick individuals to grant access to a hidden item |

Use Hide + Share to reveal content to specific players before the full group.

---

## Vault (Advanced)

All content is also stored as Markdown files in the `vault/` folder on the server. You can edit these directly in Obsidian or any text editor — changes are picked up live.

Structure:
```
vault/<campaign-slug>/
├── Quests/
├── NPCs/
├── Locations/
├── Hooks/
└── GM-Only/   ← never shown to players
```

Files use YAML frontmatter for metadata. Creating content via the app also writes these files automatically.
