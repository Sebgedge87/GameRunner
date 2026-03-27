<template>
  <div class="page-content gbc-page">
    <div class="page-header">
      <div class="page-title">
        {{ isGm ? 'Card Deck' : 'My Cards' }}
      </div>
      <div class="gbc-header-right">
        <div class="gbc-counts">
          <span class="gbc-count good">🐶 {{ myGoodCount }} Good</span>
          <span class="gbc-count bad">😈 {{ myBadCount }} Bad</span>
        </div>
        <button v-if="isGm" class="btn btn-primary btn-sm" @click="openAward">+ Award Card</button>
      </div>
    </div>

    <!-- ── GM view: tabs for each player ───────────────────────────────── -->
    <template v-if="isGm">
      <div class="gbc-player-tabs">
        <button
          v-for="p in players"
          :key="p.id"
          class="gbc-player-tab"
          :class="{ active: gmTab === p.id }"
          @click="gmTab = p.id"
        >
          {{ p.character_name || p.username }}
          <span v-if="unplayedFor(p.id)" class="nav-badge">{{ unplayedFor(p.id) }}</span>
        </button>
      </div>

      <div v-if="gmTab" class="gbc-hand">
        <div v-if="cardsFor(gmTab).length === 0" class="empty-state">No cards awarded yet.</div>
        <div
          v-for="c in cardsFor(gmTab)"
          :key="c.id"
          class="gbc-card"
          :class="[c.type, c.tier, { played: !!c.played_at }]"
        >
          <div class="gbc-card-corner">{{ TIER_LABEL[c.tier] }}</div>
          <div class="gbc-card-icon">{{ c.type === 'good' ? '🐶' : '😈' }}</div>
          <div class="gbc-card-name">{{ c.name }}</div>
          <div class="gbc-card-effect">{{ c.effect }}</div>
          <div v-if="c.played_at" class="gbc-card-played-stamp">Played</div>
          <div v-if="c.played_note" class="gbc-card-note">"{{ c.played_note }}"</div>
          <div class="gbc-card-footer">
            <span class="gbc-card-date">Awarded {{ fmtDate(c.awarded_at) }}</span>
            <button v-if="!c.played_at" class="gbc-rm-btn" @click="removeCard(c.id)" title="Remove card">✕</button>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Player view: their own hand ─────────────────────────────────── -->
    <template v-else>
      <div class="gbc-filter-row">
        <button
          v-for="f in FILTERS"
          :key="f.val"
          class="filter-tab"
          :class="{ active: filter === f.val }"
          @click="filter = f.val"
        >{{ f.label }}</button>
      </div>

      <div v-if="filteredCards.length === 0" class="empty-state">
        {{ filter === 'unplayed' ? 'No unplayed cards — roll those nat 20s!' : 'No cards here yet.' }}
      </div>

      <div class="gbc-hand">
        <div
          v-for="c in filteredCards"
          :key="c.id"
          class="gbc-card"
          :class="[c.type, c.tier, { played: !!c.played_at, 'can-play': !c.played_at }]"
          @click="!c.played_at && openPlay(c)"
        >
          <div class="gbc-card-corner">{{ TIER_LABEL[c.tier] }}</div>
          <div class="gbc-card-icon">{{ c.type === 'good' ? '🐶' : '😈' }}</div>
          <div class="gbc-card-name">{{ c.name }}</div>
          <div class="gbc-card-effect">{{ c.effect }}</div>
          <div v-if="c.played_at" class="gbc-card-played-stamp">Played</div>
          <div v-if="c.played_note" class="gbc-card-note">"{{ c.played_note }}"</div>
          <div class="gbc-card-footer">
            <span class="gbc-card-date">{{ c.played_at ? `Played ${fmtDate(c.played_at)}` : `Awarded ${fmtDate(c.awarded_at)}` }}</span>
            <button v-if="!c.played_at" class="btn btn-sm btn-primary gbc-play-btn" @click.stop="openPlay(c)">Play</button>
          </div>
        </div>
      </div>
    </template>

    <!-- ── GM: Award card modal ─────────────────────────────────────────── -->
    <div v-if="awardModal.open" class="modal-overlay" @click.self="awardModal.open = false">
      <div class="modal-box">
        <div class="modal-header">
          <span>Award a Card</span>
          <button class="modal-close" @click="awardModal.open = false">✕</button>
        </div>
        <div class="modal-body">
          <label class="form-label">Player</label>
          <select v-model="awardModal.user_id" class="form-input">
            <option value="" disabled>Select player…</option>
            <option v-for="p in players" :key="p.id" :value="p.id">
              {{ p.character_name || p.username }}
            </option>
          </select>

          <label class="form-label">Card Type</label>
          <div class="gbc-type-btns">
            <button
              class="gbc-type-btn good"
              :class="{ active: awardModal.type === 'good' }"
              @click="awardModal.type = 'good'; awardModal.card_def_id = null"
            >🐶 Good Boy (Nat 20)</button>
            <button
              class="gbc-type-btn bad"
              :class="{ active: awardModal.type === 'bad' }"
              @click="awardModal.type = 'bad'; awardModal.card_def_id = null"
            >😈 Bad Boy (Nat 1)</button>
          </div>

          <label class="form-label">Card <span style="color:var(--text3);font-weight:400">(random if not chosen)</span></label>
          <select v-model="awardModal.card_def_id" class="form-input">
            <option :value="null">— Random —</option>
            <optgroup v-for="tier in ['low','mid','high','huge']" :key="tier" :label="TIER_LABEL[tier]">
              <option
                v-for="d in defsOfType(awardModal.type, tier)"
                :key="d.id"
                :value="d.id"
              >{{ d.name }}</option>
            </optgroup>
          </select>

          <div v-if="awardModal.card_def_id" class="gbc-preview">
            <div class="gbc-preview-name">{{ defById(awardModal.card_def_id)?.name }}</div>
            <div class="gbc-preview-effect">{{ defById(awardModal.card_def_id)?.effect }}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-sm" @click="awardModal.open = false">Cancel</button>
          <button class="btn btn-primary btn-sm" :disabled="!awardModal.user_id || !awardModal.type" @click="awardCard">Award</button>
        </div>
      </div>
    </div>

    <!-- ── Player: Play card modal ──────────────────────────────────────── -->
    <div v-if="playModal.open" class="modal-overlay" @click.self="playModal.open = false">
      <div class="modal-box">
        <div class="modal-header">
          <span>Play Card</span>
          <button class="modal-close" @click="playModal.open = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="gbc-play-card-preview" :class="[playModal.card?.type, playModal.card?.tier]">
            <div class="gbc-card-icon">{{ playModal.card?.type === 'good' ? '🐶' : '😈' }}</div>
            <div class="gbc-card-name">{{ playModal.card?.name }}</div>
            <div class="gbc-card-effect">{{ playModal.card?.effect }}</div>
          </div>
          <label class="form-label" style="margin-top:12px">Add a note <span style="color:var(--text3);font-weight:400">(optional)</span></label>
          <input v-model="playModal.note" class="form-input" placeholder="e.g. using it to dodge the fireball…" />
          <p style="font-size:12px;color:var(--text3);margin-top:8px">
            The DM will be notified. This card will be spent permanently.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-sm" @click="playModal.open = false">Cancel</button>
          <button class="btn btn-primary btn-sm" @click="playCard">Play Card</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCampaignStore } from '@/stores/campaign'
import { useDataStore } from '@/stores/data'
import { useUiStore } from '@/stores/ui'

const campaign = useCampaignStore()
const data = useDataStore()
const ui = useUiStore()

const isGm = computed(() => campaign.isGm)

const TIER_LABEL = { low: 'Minor', mid: 'Moderate', high: 'Major', huge: 'Legendary' }
const FILTERS = [
  { val: 'unplayed', label: 'Unplayed' },
  { val: 'all',      label: 'All' },
  { val: 'good',     label: '🐶 Good' },
  { val: 'bad',      label: '😈 Bad' },
]

const filter    = ref('unplayed')
const myCards   = ref([])
const allCards  = ref([])   // GM only
const gmTab     = ref(null)
const defs      = ref([])

// Players derived from already-loaded users store (non-GM users)
const players = computed(() => data.users.filter(u => u.role !== 'gm'))

const awardModal = ref({ open: false, user_id: '', type: 'good', card_def_id: null })
const playModal  = ref({ open: false, card: null, note: '' })

// ── Computed ───────────────────────────────────────────────────────────────

const myGoodCount = computed(() => myCards.value.filter(c => c.type === 'good' && !c.played_at).length)
const myBadCount  = computed(() => myCards.value.filter(c => c.type === 'bad'  && !c.played_at).length)

const filteredCards = computed(() => {
  if (filter.value === 'unplayed') return myCards.value.filter(c => !c.played_at)
  if (filter.value === 'good')     return myCards.value.filter(c => c.type === 'good')
  if (filter.value === 'bad')      return myCards.value.filter(c => c.type === 'bad')
  return myCards.value
})

function cardsFor(userId)    { return allCards.value.filter(c => c.user_id === userId) }
function unplayedFor(userId) { return allCards.value.filter(c => c.user_id === userId && !c.played_at).length }
function defsOfType(type, tier) { return defs.value.filter(d => d.type === type && d.tier === tier) }
function defById(id)         { return defs.value.find(d => d.id === id) }

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ── Load ───────────────────────────────────────────────────────────────────

async function load() {
  const [defsR, cardsR] = await Promise.all([
    data.apif('/api/good-boy-cards/definitions'),
    data.apif(isGm.value ? '/api/good-boy-cards/all' : '/api/good-boy-cards/my-cards'),
  ])
  if (defsR.ok)  defs.value  = (await defsR.json()).defs
  if (cardsR.ok) {
    const d = await cardsR.json()
    if (isGm.value) {
      allCards.value = d.cards
      if (!gmTab.value && players.value.length) gmTab.value = players.value[0].id
    } else {
      myCards.value = d.cards
    }
  }
}

onMounted(load)

// ── Actions ────────────────────────────────────────────────────────────────

function openAward() {
  awardModal.value = { open: true, user_id: gmTab.value ?? '', type: 'good', card_def_id: null }
}

async function awardCard() {
  const { user_id, type, card_def_id } = awardModal.value
  const body = { user_id, type }
  if (card_def_id) body.card_def_id = card_def_id
  const r = await data.apif('/api/good-boy-cards/award', { method: 'POST', body: JSON.stringify(body) })
  if (r.ok) {
    const d = await r.json()
    allCards.value.unshift(d.card)
    awardModal.value.open = false
    ui.showToast(`Card awarded: ${d.card.name}`, '', '🐶')
    // Switch to that player's tab
    gmTab.value = user_id
  } else {
    const e = await r.json()
    ui.showToast('Award failed', e.error, '✕')
  }
}

function openPlay(card) {
  playModal.value = { open: true, card, note: '' }
}

async function playCard() {
  const r = await data.apif(`/api/good-boy-cards/${playModal.value.card.id}/play`, {
    method: 'POST',
    body: JSON.stringify({ note: playModal.value.note }),
  })
  if (r.ok) {
    // Mark as played locally
    const c = myCards.value.find(x => x.id === playModal.value.card.id)
    if (c) { c.played_at = new Date().toISOString(); c.played_note = playModal.value.note }
    playModal.value.open = false
    ui.showToast('Card played! The DM has been notified.', '', '🎴')
  } else {
    const e = await r.json()
    ui.showToast('Failed to play card', e.error, '✕')
  }
}

async function removeCard(id) {
  const r = await data.apif(`/api/good-boy-cards/${id}`, { method: 'DELETE' })
  if (r.ok) {
    allCards.value = allCards.value.filter(c => c.id !== id)
    ui.showToast('Card removed', '', '✓')
  }
}
</script>

<style scoped>
.gbc-page { max-width: 960px; }

.gbc-header-right { display: flex; align-items: center; gap: 12px; margin-left: auto; }
.gbc-counts { display: flex; gap: 10px; }
.gbc-count {
  padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
  border: 1px solid var(--border);
}
.gbc-count.good { color: #7ecf7e; border-color: #7ecf7e33; background: #7ecf7e11; }
.gbc-count.bad  { color: #cf7e7e; border-color: #cf7e7e33; background: #cf7e7e11; }

/* ── Player tabs (GM view) ── */
.gbc-player-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
.gbc-player-tab {
  padding: 6px 16px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--surface); color: var(--text2); font-size: 13px; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
}
.gbc-player-tab.active { background: var(--accent); color: #1a1008; border-color: var(--accent); font-weight: 700; }
.gbc-player-tab:hover:not(.active) { border-color: var(--accent); }

/* ── Filter tabs (player view) ── */
.gbc-filter-row { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }

/* ── Card hand grid ── */
.gbc-hand {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

/* ── Individual card ── */
.gbc-card {
  position: relative;
  border-radius: 12px;
  padding: 16px;
  display: flex; flex-direction: column; gap: 6px;
  border: 2px solid var(--border);
  background: var(--surface2);
  transition: transform 0.15s, box-shadow 0.15s;
  overflow: hidden;
  min-height: 180px;
}
.gbc-card.can-play { cursor: pointer; }
.gbc-card.can-play:hover { transform: translateY(-3px); box-shadow: 0 6px 24px var(--color-shadow-menu); }
.gbc-card.played { opacity: 0.45; filter: grayscale(0.6); }

/* Type accent colours */
.gbc-card.good { border-color: #4a9e4a55; background: linear-gradient(145deg, var(--surface2), #1a2e1a); }
.gbc-card.bad  { border-color: #9e4a4a55; background: linear-gradient(145deg, var(--surface2), #2e1a1a); }
.gbc-card.good.can-play:hover { border-color: #7ecf7e; box-shadow: 0 6px 24px #4a9e4a33; }
.gbc-card.bad.can-play:hover  { border-color: #cf7e7e; box-shadow: 0 6px 24px #9e4a4a33; }

/* Tier glow */
.gbc-card.huge.good { border-color: #c9a84c88; box-shadow: 0 0 12px #c9a84c22; }
.gbc-card.huge.bad  { border-color: #b44a4a88; box-shadow: 0 0 12px #b44a4a22; }

.gbc-card-corner {
  position: absolute; top: 8px; right: 10px;
  font-size: 9px; font-weight: 500; letter-spacing: .1em;
  color: var(--text3);
}
.gbc-card.huge .gbc-card-corner { color: #c9a84c; }
.gbc-card.high .gbc-card-corner { color: #9e7ecf; }

.gbc-card-icon { font-size: 28px; line-height: 1; margin-bottom: 2px; }
.gbc-card-name { font-size: 14px; font-weight: 700; color: var(--text); line-height: 1.2; }
.gbc-card.good .gbc-card-name { color: #9ed49e; }
.gbc-card.bad  .gbc-card-name { color: #d49e9e; }

.gbc-card-effect { font-size: 12px; color: var(--text2); line-height: 1.4; flex: 1; }
.gbc-card-note   { font-size: 11px; color: var(--text3); font-style: italic; }

.gbc-card-played-stamp {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-15deg);
  font-size: 22px; font-weight: 900; letter-spacing: .2em;
  color: var(--text3); opacity: 0.3; pointer-events: none;
  border: 3px solid currentColor; padding: 2px 10px; border-radius: 4px;
}

.gbc-card-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--border);
}
.gbc-card-date { font-size: 10px; color: var(--text3); }
.gbc-play-btn  { padding: 3px 10px; font-size: 11px; }
.gbc-rm-btn {
  background: none; border: 1px solid var(--border); border-radius: 4px;
  color: var(--text3); cursor: pointer; padding: 2px 6px; font-size: 11px;
}
.gbc-rm-btn:hover { border-color: #c0392b; color: #c0392b; }

/* ── Modals ── */
.modal-overlay {
  position: fixed; inset: 0; background: var(--color-bg-overlay-medium);
  z-index: 800; display: flex; align-items: center; justify-content: center;
}
.modal-box {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 10px; width: 420px; max-width: 94vw;
  box-shadow: 0 8px 32px var(--color-shadow-menu);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; border-bottom: 1px solid var(--border); font-weight: 600;
}
.modal-close { background: none; border: none; cursor: pointer; color: var(--text3); font-size: 14px; }
.modal-body  { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.modal-footer { padding: 12px 16px; border-top: 1px solid var(--border); display: flex; gap: 8px; justify-content: flex-end; }
.form-label { font-size: 11px; color: var(--text3); letter-spacing: .08em; }

.gbc-type-btns { display: flex; gap: 8px; }
.gbc-type-btn {
  flex: 1; padding: 8px; border-radius: 8px; border: 2px solid var(--border);
  background: var(--surface); cursor: pointer; font-size: 13px; font-weight: 600;
}
.gbc-type-btn.good.active { border-color: #7ecf7e; background: #7ecf7e11; color: #9ed49e; }
.gbc-type-btn.bad.active  { border-color: #cf7e7e; background: #cf7e7e11; color: #d49e9e; }
.gbc-type-btn:hover:not(.active) { border-color: var(--accent); }

.gbc-preview {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; padding: 10px;
}
.gbc-preview-name   { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.gbc-preview-effect { font-size: 12px; color: var(--text2); line-height: 1.4; }

.gbc-play-card-preview {
  border-radius: 10px; padding: 16px; text-align: center;
  border: 2px solid var(--border);
}
.gbc-play-card-preview.good { border-color: #7ecf7e55; background: #1a2e1a; }
.gbc-play-card-preview.bad  { border-color: #cf7e7e55; background: #2e1a1a; }
.gbc-play-card-preview .gbc-card-icon { font-size: 36px; display: block; margin-bottom: 8px; }
.gbc-play-card-preview .gbc-card-name { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.gbc-play-card-preview .gbc-card-effect { font-size: 13px; color: var(--text2); line-height: 1.5; }
</style>
