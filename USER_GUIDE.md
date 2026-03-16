# The Chronicle — User Guide

A step-by-step reference for every action available in The Chronicle, the self-hosted tabletop RPG campaign portal. Sections note whether each action is for **Players**, the **GM**, or **Both**.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Navigation & Global UI](#2-navigation--global-ui)
3. [Home](#3-home)
4. [Dashboard](#4-dashboard)
5. [Campaigns](#5-campaigns)
6. [Quests](#6-quests)
7. [Job Board](#7-job-board)
8. [NPCs](#8-npcs)
9. [Locations](#9-locations)
10. [Hooks (Story Clues)](#10-hooks-story-clues)
11. [Factions](#11-factions)
12. [Timeline](#12-timeline)
13. [Maps](#13-maps)
14. [Mindmap](#14-mindmap)
15. [Inventory](#15-inventory)
16. [Key Items](#16-key-items)
17. [Bestiary](#17-bestiary)
18. [Rumours](#18-rumours)
19. [Handouts](#19-handouts)
20. [Sessions](#20-sessions)
21. [Messages](#21-messages)
22. [Notes](#22-notes)
23. [Theory Board](#23-theory-board)
24. [Character Sheet](#24-character-sheet)
25. [Stress & Sanity](#25-stress--sanity)
26. [Agenda (Secret Objectives)](#26-agenda-secret-objectives)
27. [Combat Tracker](#27-combat-tracker)
28. [XP Awards](#28-xp-awards)
29. [Settings](#29-settings)
30. [GM Admin Tools](#30-gm-admin-tools)

---

## Interface Overview

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
│  Handouts│                                             │
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

## 1. Getting Started

### 1.1 First-Time Setup — GM

**Who:** The very first account registered automatically becomes the GM.

1. Open the app URL in your browser (e.g. `http://localhost:3000`).
2. You are redirected to the **Login / Register** page.
3. Click **Register**.
4. Fill in:
   - **Username** — your login name
   - **Password** — choose a strong password
   - **Character Name** — your display name
   - **Character Class** — optional for the GM account
5. Click **Create Account**.
6. You are now logged in with full GM access.

> After the first registration, new registrations are disabled by default. To open registration for players, set `REGISTRATION_OPEN=true` in the server `.env` file, or share a campaign invite code.

---

### 1.2 Registering as a Player

**Who:** Players.

1. The GM must either set `REGISTRATION_OPEN=true` or share a campaign **invite code** with you.
2. Open the app URL.
3. Click **Register**.
4. Fill in:
   - **Username**
   - **Password**
   - **Character Name** — your character's in-game name
   - **Character Class** — e.g. Rogue, Investigator, Marine
   - **Invite Code** — paste the code from the GM if required
5. Click **Create Account**.
6. You are logged in and added to the campaign automatically.

---

### 1.3 Logging In

**Who:** Both.

1. Open the app URL.
2. Enter your **Username** and **Password**.
3. Click **Log In**.
4. You are taken to the **Dashboard**.

---

### 1.4 Logging Out

**Who:** Both.

1. Go to **Settings** in the sidebar.
2. Click **Log Out** at the bottom.
3. You are returned to the login screen.

---

### 1.5 Changing Your Password

**Who:** Both (players change their own; GM can reset any player's password — see [User Management](#303-user-management)).

1. Go to **Settings**.
2. Under **Security**, enter your current password, then the new password twice.
3. Click **Save Password**.

---

## 2. Navigation & Global UI

### 2.1 Sidebar Navigation

**Who:** Both.

- Click any item in the left sidebar to navigate to that page.
- The active page is highlighted.
- On narrow screens, click the **≡ (hamburger)** icon in the top bar to open or close the sidebar.

---

### 2.2 Global Search

**Who:** Both.

1. Press **Ctrl+K** (Windows/Linux) or **Cmd+K** (Mac), or click the **🔍 search icon** in the top bar.
2. Type your query (minimum 2 characters).
3. Results appear grouped by type: NPCs, Quests, Locations, Handouts, Notes, etc.
4. Click any result to jump to that item's detail view.
5. Press **Escape** to close.

---

### 2.3 Notifications

**Who:** Both.

1. Click the **🔔 bell icon** in the top bar. A red badge shows the unread count.
2. The notification panel opens on the right.
3. Click a notification to navigate to the relevant page.
4. Click **✓** on a single notification to mark it as read.
5. Click **Mark All Read** to clear all at once.
6. Close by clicking the bell icon again or clicking outside the panel.

Types of notifications: new message, handout shared, secret revealed, quest updated, session reminder.

---

### 2.4 Messages Flyout

**Who:** Both.

1. Click the **✉️ envelope icon** in the top bar. A red badge shows unread messages.
2. The messages panel opens on the right.
3. Click a message to read it.
4. To **reply**: click **Reply**, type your response, click **Send**.
5. To **compose a new message**:
   - Click the **pencil (compose)** icon.
   - Select a recipient from the dropdown.
   - Enter a subject and body.
   - Click **Send**.
6. To **delete a message**: click the **🗑 trash icon** on the message row. Only the sender or GM can delete.
7. Close by clicking the envelope icon again or clicking outside.

> **GM only:** Tick **Mark as Secret** when composing to send a message only the recipient can see.

---

### 2.5 Ambient Music Toggle

**Who:** Both.

Click the **🎵 music icon** in the top bar to toggle background music on or off. Music plays from the URL set by the GM on the Home page.

---

### 2.6 Pinning Items

**Who:** Both.

1. Open any quest, NPC, or location detail panel.
2. Click the **📌 pin icon** in the panel header.
3. The item is added to your **Pins** list on the Dashboard.
4. To unpin: click the pin icon again (it will appear filled when pinned), or click the **✕** on the pin chip on the Dashboard.

---

### 2.7 Campaign Switcher

**Who:** Both (if a member of multiple campaigns).

1. Click the **campaign name dropdown** in the top-left of the top bar.
2. Select a different campaign.
3. All pages update to show content for the selected campaign.

---

## 3. Home

**Who:** Both (GM has edit access).

The Home page shows the campaign overview: story summary, current scene, weather, in-world time, and session count.

**Players:** Read-only view.

**GM — editing the Home page:**
1. Click the **✏ Edit** button on the Home page.
2. Update any fields:
   - **Story Summary** — campaign narrative overview
   - **Current Scene** — where the party is right now
   - **Current Weather** — visible to all players
   - **Current Time** — in-world date/time
   - **Music URL** — link to background audio
   - **Music Label** — display name for the track
3. Click **Save**. Players see changes immediately.

---

## 4. Dashboard

**Who:** Both.

The Dashboard is your personal at-a-glance view. Everything updates automatically via real-time events.

| Element | What it shows |
|---|---|
| Campaign banner | Name, scene, weather, in-world time, music |
| Character card | Name, class, level, current HP |
| Agenda card | Secret objective — locked until GM reveals it |
| Active quests | Quick links to in-progress quests |
| Recent messages | Unread message count and latest messages |
| Next session | Upcoming scheduled session and your RSVP |
| Pinned items | Any items you have pinned |

No actions are needed here — it is purely informational.

---

## 5. Campaigns

### 5.1 Creating a Campaign — GM

**Who:** GM only.

1. Go to **Settings** → **Campaigns**, or use the campaign dropdown in the top bar.
2. Click **New Campaign**.
3. Fill in:
   - **Name**
   - **System** — dnd5e, coc, alien, coriolis, dune, achtung
   - **Subtitle** — optional tagline
   - **Description**
   - **Max Players**
4. Click **Create Campaign**.
5. An **invite code** is auto-generated — share it with players.

---

### 5.2 Joining a Campaign — Player

**Who:** Players.

1. Go to **Settings** → **Campaigns**.
2. Click **Join Campaign**.
3. Enter the **invite code** from the GM.
4. Click **Join**.

---

### 5.3 Activating a Campaign — GM

**Who:** GM only. Only one campaign is active at a time.

1. Go to **Settings** → **Campaigns**.
2. Find the campaign to activate.
3. Click **Set Active**. All pages now show content for this campaign.

---

### 5.4 Editing Campaign Details — GM

**Who:** GM only.

1. Go to **Settings** → **Campaigns**.
2. Click **✏ Edit** next to the campaign.
3. Update: name, description, theme, music URL, music label, current scene, weather, in-world time.
4. Click **Save**.

---

### 5.5 Managing Campaign Members — GM

**Who:** GM only.

1. Go to **Settings** → **Campaigns** → click **Members** on a campaign.
2. The member list shows all players and their roles.
3. To **add a member**: type a username in the **Add Member** field → click **Add**.
4. To **remove a member**: click the **✕** next to their name.
5. To **change a member's role**: click the role badge to toggle between player and gm.

---

## 6. Quests

**Who:** Players (view), GM (create/edit/delete/manage visibility).

### Viewing Quests — Player

1. Click **Quests** in the sidebar.
2. Quest cards show title, status badge, type, and cover image.
3. Click a card to open the **detail panel** showing:
   - Full description and progress notes
   - Linked NPCs and locations (clickable)
   - Quest type and status
4. Use the **filter bar** to filter by status: Active, Completed, Failed, or All.
5. Click the **📌 pin icon** on any quest to pin it to the Dashboard.

### Creating a Quest — GM

1. Click **Quests** in the sidebar.
2. Click the **+ New Quest** button (or the **+** floating action button).
3. Fill in:
   - **Title**
   - **Type** — Main, Side, Personal, Faction
   - **Status** — Active, Completed, Failed
   - **Description**
   - **Progress Notes** — current state
   - **Linked NPCs** and **Linked Locations**
   - **Cover Image** — upload an image
   - **Visibility** — Public or Hidden
4. Click **Save**. The quest is written to the vault as a `.md` file.

### Editing a Quest — GM

1. Open the quest detail panel.
2. Click **✏ Edit** in the panel header.
3. Update any fields.
4. Click **Save**. The vault file updates automatically.

### Deleting a Quest — GM

1. Open the quest detail panel.
2. Click **🗑 Delete**.
3. Confirm. The quest is removed from the database and vault.

### Changing Quest Status — GM

1. Open the quest, click **✏ Edit**.
2. Change the **Status** dropdown.
3. Click **Save**.

### Toggling Quest Visibility — GM

Click the **👁 eye icon** on the quest card or in the detail panel to toggle between Hidden and Visible.

### Sharing a Hidden Quest with Specific Players — GM

1. Open the quest detail panel.
2. Click **Share**.
3. Select players from the list.
4. Click **Share**. Those players can now see this quest even though it is hidden from others.

---

## 7. Job Board

**Who:** Players (view), GM (create/edit/delete).

### Viewing Jobs — Player

1. Click **Job Board** in the sidebar.
2. Job cards show title, location, reward, and difficulty.
3. Click a job to read the full description and contact NPC.

### Creating a Job — GM

1. Click **Job Board**.
2. Click **+ New Job**.
3. Fill in:
   - **Title**, **Description**
   - **Location** — where the job is posted
   - **Reward** — what the party receives on completion
   - **Difficulty**
   - **Contact NPC** — who posted the job
   - **Expires At** — optional deadline
   - **Promoted Quest** — links this job to an existing quest when accepted
   - **Visibility**
4. Click **Save**.

### Editing / Deleting a Job — GM

Click the job card → **✏ Edit** or **🗑 Delete**.

### Promoting a Job to a Quest — GM

1. Edit the job.
2. Set the **Promoted Quest** field to an existing quest.
3. Save. When a player accepts the job, that quest is activated for them.

---

## 8. NPCs

**Who:** Players (view), GM (create/edit/delete/manage visibility).

### Viewing an NPC — Player

1. Click **NPCs** in the sidebar.
2. NPC cards show portrait, name, and role.
3. Click a card to open the detail panel:
   - Full description, current location, faction affiliation
   - Linked quests and locations (clickable)
   - Disposition badge: Friendly / Neutral / Hostile

### Creating an NPC — GM

1. Click **NPCs**.
2. Click **+ New NPC**.
3. Fill in:
   - **Name**, **Role / Occupation**
   - **Description**
   - **Location** — where they currently are
   - **Faction** — faction they belong to
   - **Disposition** — Friendly, Neutral, or Hostile
   - **GM Notes** — private notes (never shown to players)
   - **Portrait Image** — upload a portrait
   - **Visibility**
4. Click **Save**. A `.md` file is created in the vault.

### Editing / Deleting an NPC — GM

Open the NPC detail panel → **✏ Edit** or **🗑 Delete**.

### Toggling NPC Visibility — GM

Click the **👁 eye icon** on the NPC card or detail panel.

---

## 9. Locations

**Who:** Players (view), GM (create/edit/delete/manage visibility).

### Viewing a Location — Player

1. Click **Locations** in the sidebar.
2. Cards show map art, name, and danger level.
3. Click a card to open the detail panel:
   - Full description
   - NPCs currently present (clickable)
   - Quests available here

### Creating a Location — GM

1. Click **Locations**.
2. Click **+ New Location**.
3. Fill in:
   - **Name**, **Description**
   - **Danger Level** — Safe, Low, Medium, High, Extreme
   - **Image** — upload a location image
   - **Visibility**
4. Click **Save**.

### Editing / Deleting a Location — GM

Open the detail panel → **✏ Edit** or **🗑 Delete**.

---

## 10. Hooks (Story Clues)

**Who:** Players (view), GM (create/edit/delete).

Hooks are story clues and leads for the party to investigate.

### Viewing Hooks — Player

1. Click **Hooks** in the sidebar.
2. Cards show title and type tag.
3. Click a card to read the full description.

### Creating a Hook — GM

1. Click **Hooks** → **+ New Hook**.
2. Fill in: **Title**, **Type** (Clue / Mystery / Theory), **Description**, **Status** (Active / Resolved / Hidden), **Visibility**.
3. Click **Save**.

### Editing / Deleting a Hook — GM

Open the hook → **✏ Edit** or **🗑 Delete**.

---

## 11. Factions

**Who:** Players (view), GM (create/edit/delete/manage reputation).

### Viewing Factions — Player

1. Click **Factions** in the sidebar.
2. Cards show faction logo, name, goals, and the party's current reputation.
3. Reputation runs from **−3 (Hostile)** to **+3 (Allied)**, shown as a fill bar.

### Creating a Faction — GM

1. Click **Factions** → **+ New Faction**.
2. Fill in: **Name**, **Description**, **Goals**, **Image / Logo**, **Visibility**.
3. Click **Save**.

### Adjusting Faction Reputation — GM

1. Open the faction detail panel or find it in the list.
2. Use the **reputation slider** or **+/−** buttons to adjust the score (−3 to +3).
3. Changes save automatically.

### Editing / Deleting a Faction — GM

Open the faction → **✏ Edit** or **🗑 Delete**.

---

## 12. Timeline

**Who:** Players (view), GM (create/edit/delete).

### Viewing the Timeline — Player

1. Click **Timeline** in the sidebar.
2. Events are listed chronologically with in-world dates.
3. Events linked to a quest or NPC show a clickable reference.

### Adding a Timeline Event — GM

1. Click **Timeline** → **+ New Event**.
2. Fill in:
   - **Title**, **Description**
   - **In-World Date**
   - **Session Number** — optional link to a session recap
   - **Linked Item** — optionally link to a quest, NPC, or location
   - **Visibility**
3. Click **Save**.

### Editing / Deleting an Event — GM

Click the event → **✏ Edit** or **🗑 Delete**.

---

## 13. Maps

**Who:** Players (view), GM (upload/edit/delete/manage visibility).

### Viewing Maps — Player

1. Click **Maps** in the sidebar.
2. Map thumbnails appear in a gallery.
3. Click a map to open the full-screen viewer:
   - **Scroll** to zoom in/out.
   - **Click and drag** to pan.
4. Press **Escape** or click outside to close the viewer.

### Uploading a Map — GM

1. Click **Maps** → **+ Upload Map**.
2. Fill in:
   - **Title**, **Description**
   - **Map Type** — World, Region, City, Dungeon, Encounter
   - **Image** — select a file (JPG/PNG/WebP, max 20 MB)
   - **Visibility**
3. Click **Upload**.

### Editing / Deleting a Map — GM

Click the map thumbnail → **✏ Edit** (to update metadata) or **🗑 Delete** (removes the map and file).

### Toggling Map Visibility — GM

Click the **👁 eye icon** on the map thumbnail.

---

## 14. Mindmap

**Who:** Players (view), GM (view + edit mode).

The Mindmap is an interactive force-directed graph showing all vault content and connections.

### Exploring the Mindmap

1. Click **Mindmap** in the sidebar.
2. The graph loads with colour-coded nodes:
   - Gold = Quests, Blue = NPCs, Green = Locations, Purple = Hooks
3. **Drag** nodes to rearrange.
4. **Scroll** to zoom.
5. **Click** a node to open a popout card with image, type, and 2-line summary.
6. Click the link in the popout to navigate to that item's full detail page.
7. Edges between nodes are labeled (e.g. "Connected to", "Related to").

### GM Edit Mode

1. Click the **Edit** toggle in the top-right.
2. In edit mode, click nodes to update their connections in the vault.
3. Toggle edit mode off to return to read-only view.

---

## 15. Inventory

**Who:** Players (view visible items), GM (full access + visibility control).

### Viewing Inventory — Player

1. Click **Inventory** in the sidebar.
2. Items are grouped by holder: **Party**, **Warehouse**, or an NPC's name.
3. Each item shows quantity, image, and description.

### Adding an Item — GM

1. Click **Inventory** → **+ Add Item**.
2. Fill in:
   - **Name**, **Description**, **Quantity**
   - **Holder** — Party, Warehouse, or an NPC name
   - **Image** — optional
   - **Hidden** — tick to hide from players initially
3. Click **Save**.

### Editing / Deleting an Item — GM

Click the item → **✏ Edit** or **🗑 Delete**.

### Toggling Item Visibility — GM

Click the **👁 eye icon** on the item row.

---

## 16. Key Items

**Who:** Players (view visible items), GM (full access).

Key Items are quest-critical objects tracked separately from general inventory.

All steps — creating, editing, deleting, and toggling visibility — are identical to [Inventory](#15-inventory). Access via the **Key Items** section of the GM panel or sidebar.

Each key item additionally supports:
- **Significance** — a short note explaining why this item matters
- **Linked Quest** — tie the item directly to a quest

---

## 17. Bestiary

**Who:** Players (view revealed creatures), GM (full access + reveal control).

### Viewing Creatures — Player

1. Click **Bestiary** in the sidebar.
2. Only creatures the GM has **revealed** are shown.
3. Click a creature to see: portrait, description, HP, AC, and abilities.

### Adding a Creature — GM

1. Click **Bestiary** → **+ New Creature**.
2. Fill in:
   - **Name**, **Description**
   - **Portrait Image**
   - **Stats** — HP, AC, and system-specific abilities
   - **Hidden** — tick to hide from players
3. Click **Save**.

### Revealing a Creature to Players — GM

1. Find the creature in the list.
2. Click **Reveal**. Players can now see this entry.

> Revealing is separate from visibility. A creature must be both revealed AND not hidden to appear for players.

### Editing / Deleting a Creature — GM

Click the creature → **✏ Edit** or **🗑 Delete**.

---

## 18. Rumours

**Who:** Players (view), GM (create/edit/delete — knows truth value).

Players see rumours but do not know if they are true or false.

### Viewing Rumours — Player

1. Click **Rumours** in the sidebar.
2. Rumours are listed with source NPC or location.
3. Click a rumour to read its full text.

### Creating a Rumour — GM

1. Click **Rumours** → **+ New Rumour**.
2. Fill in:
   - **Text** — what the rumour says
   - **Source NPC** — who is spreading it
   - **Source Location** — where it was heard
   - **Is True** — whether the rumour is accurate (hidden from players)
   - **Visibility**
3. Click **Save**.

### Exposing a Rumour's Truth — GM

1. Click the rumour.
2. Click **Expose Truth**. Players can now see whether the rumour was true or false.

### Editing / Deleting a Rumour — GM

Open the rumour → **✏ Edit** or **🗑 Delete**.

---

## 19. Handouts

**Who:** Players (view what is shared with them), GM (create/share/manage).

### Viewing a Handout — Player

1. Click **Handouts** in the sidebar.
2. You see only handouts that have been shared with you.
3. Click a handout to open it. Text handouts display inline; PDFs and images open in a viewer.
4. If the handout **requires acknowledgment**, click **Acknowledge** after reading. The GM sees who has acknowledged.
5. If you have **reshare permission**, click **Share With…**, select another player, then click **Share**.

### Creating a Handout — GM

1. Click **Handouts** → **+ New Handout**.
2. Fill in:
   - **Title**, **Description**
   - **Type** — Text, Image, or PDF
   - **Body** — text content (for text handouts)
   - **File** — upload a file (for image/PDF handouts)
   - **Requires Acknowledgment** — tick if players must confirm they read it
3. Click **Save**. The handout is created but not yet visible to anyone.

### Sharing a Handout with Players — GM

1. Find the handout in the list.
2. Click **Share**.
3. Select one or more players.
4. Optionally tick **Allow Resharing**.
5. Click **Share**. Selected players receive a notification.

### Viewing Acknowledgment Status — GM

Open the handout. The acknowledgment panel lists every player it was shared with and whether they have acknowledged it.

### Deleting a Handout — GM

Open the handout → **🗑 Delete**. Removed for all players it was shared with.

---

## 20. Sessions

### 20.1 Session Recaps

**Who:** Players (view), GM (create/edit/delete).

#### Viewing Session Recaps — Player

1. Click **Sessions** in the sidebar.
2. Sessions are listed newest-first.
3. Click a session to read the recap: summary, in-world date, and any public player notes.

#### Creating a Session Recap — GM

1. Click **Sessions** → **+ New Session**.
2. Fill in:
   - **Title**, **Session Number**
   - **Played At** — real-world date
   - **In-World Date**
   - **Summary** — narrative recap
3. Click **Save**.

#### Editing / Deleting a Session Recap — GM

Open the session → **✏ Edit** or **🗑 Delete**.

---

### 20.2 Session Notes — Player

**Who:** Players only.

1. Open a session recap.
2. Scroll to **Your Notes** → click **+ Add Note**.
3. Type your note.
4. Set **Privacy**: **Private** (only you) or **Public** (all players + GM).
5. Click **Save**.

#### Editing a Session Note

Find your note under the session → click **✏ Edit** → update text or privacy → **Save**.

#### Deleting a Session Note

Find your note → click **🗑 Delete** → confirm.

---

### 20.3 Polls

**Who:** Players (vote), GM (create/reveal/close/delete).

#### Voting in a Poll — Player

1. Open a session or check the Dashboard for active polls.
2. Click the poll card.
3. Select your preferred option.
4. Click **Vote**. You can only vote once. Results are hidden until the GM reveals them.

#### Creating a Poll — GM

1. Click **Sessions** → **+ New Poll**.
2. Fill in the **Question** and add 2–4 **Options** (click **+ Add Option** for each).
3. Click **Create Poll**. Players are notified.

#### Revealing Poll Results — GM

Find the poll → click **Reveal Results**. Vote counts become visible to all players.

#### Closing a Poll — GM

Find the poll → click **Close Poll**. No further votes can be cast.

#### Deleting a Poll — GM

Find the poll → click **🗑 Delete** → confirm.

---

### 20.4 Scheduling

**Who:** Players (respond), GM (propose/confirm).

#### Responding to a Proposed Date — Player

1. Click **Sessions** → **Scheduling** tab.
2. For each proposed date, click your availability:
   - **Yes** — you can make it
   - **Maybe** — possibly
   - **No** — you cannot make it
3. Your response saves automatically.

#### Proposing a Session Date — GM

1. Click **Sessions** → **Scheduling** → **+ Propose Date**.
2. Enter the **date and time** and an optional note.
3. Click **Save**. Players are notified to respond.

#### Confirming a Date — GM

Once responses are in, click **Confirm** on the preferred date. Players are notified of the confirmed date.

---

## 21. Messages

**Who:** Both.

### Reading Messages

Click the **✉️ envelope icon** in the top bar. Unread messages are highlighted. Click a message to read it.

### Sending a Message

1. Open the messages flyout → click the **✏ compose icon**.
2. Select a **recipient** (specific player or All Players).
3. Enter a **subject** and **body**.
4. Click **Send**.

### Replying to a Message

Open the message → click **Reply** → type your reply → click **Send**.

### Deleting a Message

Open the message or find it in the list → click **🗑 Delete**. Only the sender or GM can delete.

### Secret Messages — GM only

When composing: tick **Mark as Secret** before sending. Only the recipient can see the message; it cannot be forwarded.

### Requiring Acknowledgment — GM only

When composing: tick **Require Acknowledgment**. The recipient sees an **Acknowledge** button and the GM can track who has confirmed they read it.

---

## 22. Notes

**Who:** Players (own notes), GM (can view all notes based on privacy settings).

Notes are personal markdown documents written directly to the Obsidian vault.

### Creating a Note

1. Click **Notes** in the sidebar → **+ New Note**.
2. Fill in:
   - **Title**
   - **Category** — Notes, Clues, Plans, Lore
   - **Body** — write in markdown
   - **Privacy**:
     - **Private** — only you see it
     - **Shared with GM** — you and the GM see it
     - **Public** — all players can see it
3. Click **Save**. Written to vault as a `.md` file.

### Editing a Note

Find the note → click **✏ Edit** → update → **Save**.

### Deleting a Note

Find the note → click **🗑 Delete** → confirm. Soft-deleted in the vault (marked in frontmatter).

### Changing Note Privacy

Edit the note → change the **Privacy** dropdown → **Save**.

---

## 23. Theory Board

**Who:** Players (own board), GM (view shared nodes only).

Your private investigation corkboard for connecting facts and building theories.

### Adding a Node

1. Click **Theory Board** in the sidebar.
2. Click **+ Add Node** or double-click on empty canvas space.
3. Choose the node type:
   - **Theory** — a custom idea or hypothesis
   - **NPC / Quest / Location** — link to a vault item
4. Enter a **label** and optional **notes**.
5. If linking to a vault item, search for it in the **Vault Reference** field.
6. Click **Save**. The node appears on the canvas.

### Moving a Node

Click and drag any node to reposition it.

### Drawing a Connection

1. Hover over a node until the **connection handle** (small circle) appears on its edge.
2. Click and drag to another node.
3. Enter a **label** for the connection (e.g. "knows about", "enemy of").
4. Click **Save**.

### Editing a Node

Click the node → click **✏ Edit** in the tooltip → update → **Save**.

### Deleting a Node or Connection

Click the node or edge → click **🗑 Delete** → confirm. Deleting a node also removes its connections.

### Sharing with the GM

Click a node → click **Share with GM**. The GM can now see this node and its edges.

---

## 24. Character Sheet

**Who:** Players (own sheet), GM (view all + edit any).

Sheet layout adapts automatically to the campaign's game system (D&D 5e, Call of Cthulhu, Alien, Coriolis, etc.).

### Viewing Your Sheet — Player

Click **Character Sheet** in the sidebar. Your sheet is displayed in the format for your system.

### Editing Your Sheet — Player

1. Click **Character Sheet** → click **✏ Edit** (or click directly on an editable field).
2. Update:
   - **Name, Class, Level, HP**
   - **Ability scores** (D&D: STR, DEX, CON, INT, WIS, CHA)
   - **Skills and saving throws**
   - **Backstory / Description**
   - System-specific fields as shown
3. Click **Save**.

### Linking D&D Beyond (D&D 5e only)

1. On your character sheet, click **Link D&D Beyond**.
2. Paste your D&D Beyond character URL.
3. Click **Save**.

### Viewing Another Player's Sheet — GM

Click **Character Sheet** → use the **player selector dropdown** at the top to choose a player. You can edit any field if needed.

### Ship / Vehicle Sheets — GM

1. Click **Character Sheet** → **Ships** tab.
2. Click **+ New Ship** → fill in system-specific stats → **Save**.
3. Click an existing ship to **✏ Edit** or **🗑 Delete** it.

---

## 25. Stress & Sanity

**Who:** Players (view own), GM (view all + update).

Available in systems with mental health tracking: Call of Cthulhu (Sanity), Alien (Stress), Achtung! Cthulhu, Coriolis.

### Viewing Your Stress / Sanity — Player

Go to **Character Sheet** or **Dashboard**. Current **Stress**, **Sanity**, **Exhaustion**, and **Panic Threshold** are shown as progress bars.

### Updating Stress / Sanity — GM

1. Go to the **GM Dashboard** or open a player's character sheet.
2. Find the player's stress/sanity tracker.
3. Click **✏ Edit** next to the tracker.
4. Adjust:
   - **Stress / Stress Max**
   - **Sanity / Sanity Max**
   - **Exhaustion**
   - **Panic Threshold**
   - **Indefinite Insanity** — toggle for permanent breakdown
5. Click **Save**. The player sees changes immediately.

---

## 26. Agenda (Secret Objectives)

**Who:** Players (view own when revealed), GM (create/reveal/edit/delete).

### Viewing Your Agenda — Player

Go to the **Dashboard**. The **Agenda** card shows **Locked** until the GM reveals it. Once revealed, read your secret objective there.

### Creating a Player's Agenda — GM

1. Go to **GM Dashboard** → **Agendas** section → **+ New Agenda**.
2. Select the **player**.
3. Fill in **Title** and **Body** (the secret objective text).
4. Click **Save**. The player sees a locked card but cannot read the content yet.

### Revealing an Agenda — GM

Find the agenda in the GM Dashboard → click **Reveal**. The player is notified and can now read their objective.

### Editing / Deleting an Agenda — GM

Open the agenda → **✏ Edit** or **🗑 Delete**.

---

## 27. Combat Tracker

**Who:** Players (view), GM (full control).

### Starting a Combat Encounter — GM

1. Click **Combat** in the sidebar.
2. Click **+ New Encounter**.
3. Enter the **encounter name** (e.g. "Bandit Ambush").
4. Click **Create**. Any previously active encounter is deactivated.

### Adding Combatants — GM

1. Open the active encounter → click **+ Add Combatant**.
2. Fill in:
   - **Name**
   - **Initiative** — rolled initiative order
   - **HP Current / Max**
   - **AC** — Armour Class
   - **Is Player** — tick if this is a player character
   - **Is Hidden** — tick to hide an enemy from players until revealed
3. Click **Add**. Combatants sort by initiative automatically. Repeat for all combatants.

### Updating HP — Both

Click a combatant row. Edit **HP Current** directly in the row. Players can update their own HP; GM can update any combatant.

HP bars change colour automatically:
- **Green** — above 50%
- **Yellow** — 25–50%
- **Red** — below 25%

### Adding / Removing Conditions — GM

Click a combatant row. Use the **condition tags** to add or remove conditions (Poisoned, Stunned, Prone, etc.).

### Advancing the Round — GM

Click **Next Round** at the end of a round. The round counter increments.

### Removing a Combatant — GM

Click the **✕** button next to a combatant to remove them (e.g. a defeated enemy).

### Ending Combat — GM

Click **End Encounter** → confirm. The encounter is marked inactive and removed from the active view.

---

## 28. XP Awards

**Who:** GM only.

### Awarding XP

1. Go to **GM Dashboard** → **XP Awards** → **+ Award XP**.
2. Fill in:
   - **Player** — select from dropdown
   - **Amount** — XP to award
   - **Reason** — what the XP is for
3. Click **Award**. The player's XP total updates on their character sheet.

### Removing an XP Award

Find the award in the list → click the **🗑 trash icon** → confirm.

---

## 29. Settings

**Who:** Both.

### Changing Your Theme

1. Go to **Settings** → **Appearance**.
2. Select a theme from the dropdown:

| Theme | Aesthetic |
|---|---|
| dnd5e | Gold and parchment fantasy (default) |
| coc | Dark noir with paper texture |
| alien | Green-on-black with CRT scanlines |
| coriolis | Dark blue space-opera |
| dune | Desert gold |
| achtung | Military green wartime |

3. The UI updates immediately.

### Toggling Background Music

**Settings** → toggle the **Background Music** switch on or off.

### Changing Your Password

**Settings** → **Security** → enter current password and new password twice → **Save Password**.

### Logging Out

**Settings** → **Log Out** at the bottom.

---

## 30. GM Admin Tools

### 30.1 User Management

**Who:** GM only.

1. Go to **Settings** → **Users** (or GM Dashboard → Player Management).
2. The full user list shows username, character name, class, level, and role.

**Editing a User:**
1. Click **✏ Edit** next to the user.
2. Update name, class, level, or role.
3. Click **Save**.

**Resetting a Password:**
1. Click **Reset Password** next to the user.
2. Enter and confirm the new password.
3. Click **Save**.

**Deleting a User:**
1. Click **🗑 Delete** next to the user.
2. Confirm. This is permanent.

---

### 30.2 Audit Log

**Who:** GM only.

1. Go to **Settings** → **Audit Log**.
2. The last 200 GM actions are listed showing: user, action type, target, detail, IP address, and timestamp.
3. Use this to review who changed what and when.

---

### 30.3 Database Backup

**Who:** GM only.

1. Go to **Settings** → **Backup**.
2. Click **Download Backup**.
3. The SQLite database is downloaded to your computer.

> Back up regularly — especially before major sessions or server updates. The backup contains the full database.

---

### 30.4 Show / Hide & Item-Level Sharing

Every piece of content has visibility controls (GM only):

| Control | What it does |
|---|---|
| 👁 **Show** | Makes the item visible to all players |
| 🚫 **Hide** | Hides it from all players |
| **Share** button | Opens a player list — tick individuals to grant access to a hidden item |

Use **Hide + Share** to reveal content to specific players before the full group.

---

### 30.5 Vault (Advanced)

All content is also stored as Markdown files in the `vault/` folder on the server. You can edit these directly in Obsidian or any text editor — changes are picked up live.

Vault structure:
```
vault/<campaign-slug>/
├── Quests/
├── NPCs/
├── Locations/
├── Hooks/
└── GM-Only/   ← never shown to players
```

Files use YAML frontmatter for metadata. Creating content via the app also writes these files automatically.

---

*Last updated: March 2026*
