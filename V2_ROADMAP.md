# GameRunner v2 Roadmap

> **Status:** Post-v1 planning document. Items are grouped by priority tier and rough effort.
> Update this file when items are started, scoped, or dropped.

---

## Guiding principles for v2

1. **Feedback loop first** — close the loop between session play and GM prep. The GM should know what resonated, what confused, and what players want more of without having to ask in Discord.
2. **Reduce GM busywork** — every form, modal, and flow that costs the GM friction should get leaner.
3. **Players should feel like participants, not viewers** — more agency, more personalisation, more ways to leave a mark.

---

## Tier 1 — High value, relatively contained

### 1.1 Post-session player feedback
**Problem:** GM has no structured way to collect session impressions. Currently polls exist but are generic and manual.

**Proposed UX:**
- GM clicks "End Session" on a session record → a **feedback round** is triggered automatically
- Players see a brief (3-question max) card on login or via SSE notification:
  - ⭐ Session rating 1–5
  - 💬 "Best moment this session?" (free text, max 200 chars)
  - ❓ "Anything you're confused about?" (free text, optional)
- Responses are anonymous to other players; GM sees all
- GM Dashboard → Sessions tab shows aggregate ratings over time (sparkline) and recent comments

**Backend:** `POST /api/sessions/:id/feedback`, `GET /api/sessions/:id/feedback` (GM only)
**Tables:** `session_feedback (id, session_id, user_id, rating, highlight, question, created_at)`
**Effort:** Medium (3–4 days)

---

### 1.2 Password self-service for players
**Problem:** Players cannot reset their own password. GM must do it via dashboard — annoying at scale.

**Proposed UX:**
- Login page: "Forgot password?" link
- Since this is self-hosted with no email, GM generates a one-time reset token via GM Dashboard → Players tab → "Reset password" → copies a short token
- Player visits `/reset?token=XXXX`, sets new password
- Token expires after 24h or first use

**Backend:** `POST /api/auth/reset-token` (GM only), `POST /api/auth/reset-password` (token + new password)
**Tables:** `reset_tokens (id, user_id, token_hash, expires_at, used)`
**Effort:** Small (1–2 days)

---

### 1.3 XP / milestone tracker — surface in player view
**Problem:** `xp.js` and the `xp_awards` table exist and are wired up, but there is no player-facing UI. Players have no way to see their XP or current level.

**Proposed UX:**
- Character sheet sidebar / header: XP total + level badge
- XP award history tab on character sheet (date, amount, reason)
- GM Dashboard: "Award XP" button per player, bulk award to full party
- SSE push: player sees a "+150 XP — Dragon defeated" toast in real time

**Effort:** Small–Medium (2 days — routes already exist)

---

### 1.4 GmEditModal refactor
**Problem:** 1,291-line God Component, 18 entity types, growing risk of regressions.

**Plan:** Extract each entity type into its own `GmForm[Type].vue` component (e.g. `GmFormNpc.vue`, `GmFormQuest.vue`). `GmEditModal.vue` becomes a thin router — `<component :is="formComponent" />`. Do one type per PR to keep diffs reviewable and regressions catchable.

**Effort:** Large (1 week+), done incrementally over the sprint

---

### 1.5 Ambient audio engine
**Problem:** Deferred from v1. System-specific background audio significantly improves atmosphere.

**Plan:**
- `AudioEngine.js` singleton: manages a single `<audio>` element, playlist queue, volume, fade in/out
- Per-system default tracks stored in `/public/audio/[system]/` (GM provides their own files — no bundled copyright content)
- GM Dashboard audio panel: upload tracks, assign to system, enable/disable
- SSE event `audio:play` lets GM push a specific track to all connected players mid-session
- Player settings: master volume, mute toggle, persisted in localStorage

**Tables:** `audio_tracks (id, campaign_id, system, label, file_path, auto_play)`
**Effort:** Large (1 week)

---

## Tier 2 — High impact but more scope

### 2.1 In-session reactions
**Problem:** Players have no lightweight way to react in-the-moment. Waiting for post-session feedback loses the signal.

**Proposed UX:**
- Floating reaction bar (player-only, dismissible): 👏 😮 😂 💀 ❤️
- Reactions are ephemeral — visible to all for 5s via SSE, then fade. Not persisted (no DB bloat).
- GM sees a small reaction counter overlay in the corner of the GM dashboard during a session

**Effort:** Small–Medium (1.5 days — mostly SSE + CSS)

---

### 2.2 Player character journal
**Problem:** Players can add notes but there is no structured "journal" per session — a player-owned narrative record of events from their character's perspective.

**Proposed UX:**
- Notes view → "Journal" tab: one entry per session, linked to `session_id`
- Rich text (markdown), private by default
- Optional: "share this entry with party" toggle → visible in party feed
- GM cannot read private journal entries (enforced server-side)

**Effort:** Medium (3 days)

---

### 2.3 Dice roller
**Problem:** Players/GM often roll dice outside the app (physical or separate tool) breaking immersion.

**Proposed UX:**
- Persistent dice tray in sidebar footer (collapsible)
- Standard polyhedral set: d4, d6, d8, d10, d12, d20, d100
- Notation input: `2d6+3`, `1d20 adv` (advantage = roll twice take higher)
- GM can **request a roll**: SSE push shows a roll prompt to one or all players — player rolls in-app, result is broadcast to GM
- Roll history panel (last 20 rolls, session-scoped)
- System-aware: advantage/disadvantage (D&D), push mechanic (Year Zero), bonus dice (Alien)

**Effort:** Medium (3–4 days)

---

### 2.4 Campaign switching polish + multi-GM
**Problem:** Campaign switcher works but has friction. Only one GM account is supported.

**Proposed UX:**
- Per-campaign "co-GM" role: can edit content but not manage users or billing
- Campaign switcher: show last-active indicator, session count, player count per campaign
- GM Dashboard campaign settings: rename, change system, archive (soft-delete), export

**Effort:** Medium (3–4 days)

---

### 2.5 Vault bidirectional sync audit
**Problem:** Vault watcher reads Obsidian files into the DB but write-back (DB → vault) has not been audited for edge cases. Entity edits via the UI may diverge from vault files.

**Plan:**
- Audit all `PUT`/`POST` entity routes: confirm they write back to vault file if a corresponding vault file exists
- Add a "Sync to vault" button in Settings (force re-export of all DB entities to vault format)
- Handle renamed files: if vault file is renamed, match by `vault_id` frontmatter field

**Effort:** Medium (3 days — mostly investigation + edge case handling)

---

## Tier 3 — Nice to have / post-feedback

### 3.1 Tauri desktop app wiring
`src-tauri/` scaffolding exists. Wire it up: direct vault access without HTTP proxy, system tray, auto-launch on boot. Targeted at GM-only.

### 3.2 PWA / mobile install
Add `manifest.json` and a basic service worker. Players can "Add to Home Screen" on iOS/Android for a near-native feel.

### 3.3 GM session prep checklist
Before each session: auto-generated checklist based on open quests, unresolved hooks, last session notes. Printable / PDF export.

### 3.4 Party loot / treasure log
Separate from inventory — a shared record of loot found per session, who took what, value. Simple table with session link.

### 3.5 NPC relationship web
D3 force graph (infrastructure already exists in Theory Board / Mindmap) showing NPC ↔ NPC relationships, faction membership, and player ↔ NPC bonds. Read-only for players, editable for GM.

### 3.6 Handout delivery receipts
Track whether a player has opened/read a handout. GM sees "3/5 players read" indicator. Optional: require acknowledgement before content is spoiled.

### 3.7 Player availability polling improvements
Current scheduling polls are basic. Improve: recurring availability (weekly), calendar view, iCal export link, "next available slot" auto-suggestion.

---

## Known tech debt to clear in v2

| Item | Location | Notes |
|---|---|---|
| GmEditModal God Component | `GmEditModal.vue` (1,291 lines) | Tier 1.4 above |
| Vault bidirectional sync | `server/src/routes/vault.js` | Tier 2.5 above |
| No token refresh | `client/src/stores/auth.js` | 30-day expiry is fine for now; revisit if sessions need to be shorter |
| `dnd-portal-v2.html` artifact | repo root | Legacy single-file prototype — can be deleted once v2 is stable |
| SSE reconnect backoff | `AppLayout.vue` | SSE reconnects immediately on disconnect; add exponential backoff |
| `polls` / `scheduling` not shown in sidebar nav | `AppSidebar.vue` | Routes exist, no nav link — either surface or remove |

---

## Feedback collection plan (pre-v2 scope)

Before committing to v2 scope, gather signal from actual players and GMs:

1. **Post-v1 session survey** (via in-app poll, 3 questions):
   - What feature do you wish existed?
   - What slows you down most right now?
   - Rate the overall portal experience 1–5

2. **GM retro** (30 min sync or async doc):
   - Which entity types are most used?
   - What do you prep outside the portal that should be in it?
   - What does the portal do that you never use?

3. **Watch a session** (ideal but optional): observe live to catch friction points that players won't think to report.

Survey results feed directly into tier prioritisation above — Tier 1 items that get strong signal move to the top of the v2 sprint.
