<template>
  <div class="page-content">
    <div class="home-header">
      <div class="home-title">Your Campaigns</div>
    </div>

    <div class="camp-lobby-grid">
      <!-- Campaign cards -->
      <div
        v-for="c in campaign.allCampaigns"
        :key="c.id"
        class="camp-lobby-card"
        :style="`--camp-accent:${systemMeta(c.system).color};padding-top:0`"
        @click="enterCampaign(c.id)"
      >
        <div
          class="camp-card-cover"
          :style="c.cover_image
            ? `background-image:url('${c.cover_image}')`
            : `background:linear-gradient(135deg,${systemMeta(c.system).color}22 0%,${systemMeta(c.system).color}08 100%)`"
        ></div>
        <div style="padding:14px 0 0 0;display:flex;flex-direction:column;gap:8px">
          <div class="camp-card-top">
            <span class="camp-card-sys" :style="`color:${systemMeta(c.system).color};border-color:${systemMeta(c.system).color}40;background:${systemMeta(c.system).color}18`">
              {{ systemMeta(c.system).icon }} {{ systemMeta(c.system).label }}
            </span>
            <span :class="c.my_role === 'gm' ? 'camp-card-role-gm' : 'camp-card-role-player'">
              {{ c.my_role === 'gm' ? 'GM' : 'Player' }}
            </span>
          </div>
          <div class="camp-card-name">{{ c.name }}</div>
          <div v-if="c.subtitle" class="camp-card-sub">{{ c.subtitle }}</div>
          <div v-if="c.description" class="camp-card-desc">{{ c.description }}</div>
          <div class="camp-card-footer">
            <span v-if="c.active" style="width:7px;height:7px;border-radius:50%;background:var(--green);display:inline-block" title="Active"></span>
            <span class="camp-card-stat">👥 {{ c.player_count || 0 }}{{ c.max_players ? '/' + c.max_players : '' }}</span>
            <span v-if="c.session_count" class="camp-card-stat">📅 {{ c.session_count }} sessions</span>
            <span class="camp-card-enter">Enter →</span>
          </div>
        </div>
      </div>

      <!-- Create new campaign -->
      <div class="camp-lobby-card camp-lobby-card-create" @click="showWizard = true">
        <div class="camp-lobby-create-icon">+</div>
        <div class="camp-lobby-create-label">Create a Campaign</div>
      </div>

      <!-- Join via invite code -->
      <div class="camp-lobby-card camp-lobby-card-join">
        <div class="camp-lobby-create-icon">⤵</div>
        <div class="camp-lobby-create-label">Join a Campaign</div>
        <div class="join-tile-input-row" @click.stop>
          <input
            v-model="joinCode"
            class="form-input join-tile-input"
            placeholder="INVITE CODE"
            maxlength="12"
            @keydown.enter="joinCampaign"
          />
          <button class="btn btn-primary btn-sm" @click="joinCampaign">Join</button>
        </div>
      </div>
    </div>

    <!-- Campaign Wizard -->
    <CampaignWizardModal v-if="showWizard" @close="showWizard = false" />

    <!-- Campaign Create Modal (legacy — kept for reference) -->
    <div v-if="showCreateModal" class="modal-overlay open" @click.self="showCreateModal = false">
      <div class="modal" style="max-width:560px">
        <div class="modal-title">Create Campaign</div>
        <div class="form-group"><label>Campaign Name *</label><input v-model="cc.name" class="form-input" placeholder="The Shattered Crown…" /></div>
        <div class="form-group"><label>Subtitle</label><input v-model="cc.subtitle" class="form-input" placeholder="Optional tagline" /></div>
        <div class="form-group"><label>Game System</label>
          <div id="cc-sys-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px">
            <div
              v-for="(meta, key) in campaign.SYSTEM_META"
              :key="key"
              class="sys-tile"
              :class="{ selected: cc.system === key }"
              @click="cc.system = key"
            >
              <div class="sys-tile-icon">{{ meta.icon }}</div>
              <div class="sys-tile-name">{{ meta.label }}</div>
            </div>
          </div>
        </div>
        <!-- CoC Era selector (only shown when CoC system is chosen) -->
        <div v-if="cc.system === 'coc'" class="form-group">
          <label>Era / Setting</label>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px">
            <div
              v-for="era in COC_ERAS"
              :key="era.key"
              class="sys-tile"
              :class="{ selected: cc.coc_era === era.key }"
              @click="cc.coc_era = era.key"
            >
              <div class="sys-tile-name" style="font-size:0.82em;text-align:center;padding:4px 0">{{ era.label }}</div>
            </div>
          </div>
        </div>
        <div class="form-group"><label>Max Players</label><input v-model.number="cc.max_players" class="form-input" type="number" min="1" max="20" /></div>
        <div class="form-group"><label>Invite Code (optional)</label>
          <div style="display:flex;gap:8px">
            <input v-model="cc.invite_code" class="form-input" placeholder="MYCAMP" style="flex:1;text-transform:uppercase" maxlength="12" />
            <button class="btn btn-sm" @click="genCode">Generate</button>
          </div>
        </div>
        <div class="form-group"><label>Description</label><textarea v-model="cc.description" class="form-input" rows="4"></textarea></div>
        <div class="form-group"><label>Playlist URL (Spotify / YouTube)</label><input v-model="cc.playlist_url" class="form-input" /></div>
        <div v-if="createError" class="status-msg status-err">{{ createError }}</div>
        <div class="modal-actions">
          <button class="modal-close" @click="showCreateModal = false">CANCEL</button>
          <button class="submit-btn" @click="saveCampaign" :disabled="creating">
            {{ creating ? 'CREATING…' : 'CREATE' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import { useDataStore } from '@/stores/data'
import { COC_ERAS } from '@/composables/useSystemFeatures'
import CampaignWizardModal from '@/components/CampaignWizardModal.vue'

const campaign = useCampaignStore()
const ui = useUiStore()
const data = useDataStore()
const router = useRouter()

const joinCode = ref('')
const showWizard = ref(false)

const showCreateModal = ref(false)
const creating = ref(false)
const createError = ref('')
const cc = reactive({
  name: '', subtitle: '', system: 'dnd5e', coc_era: '1920s', max_players: 4, invite_code: '', description: '', playlist_url: ''
})

function systemMeta(sys) {
  return campaign.SYSTEM_META[sys] || campaign.SYSTEM_META.dnd5e
}

async function enterCampaign(id) {
  await campaign.switchCampaign(id)
  await data.loadAll()
  router.push('/dashboard')
}

async function joinCampaign() {
  const code = joinCode.value.trim().toUpperCase()
  if (!code) { ui.showToast('Enter an invite code', '', '✕'); return }
  try {
    const c = await campaign.joinCampaign(code)
    joinCode.value = ''
    ui.showToast(`Joined "${c.name}"!`, '', '✓')
  } catch (e) {
    ui.showToast(e.message || 'Failed to join', '', '✕')
  }
}

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  cc.invite_code = code
}

async function saveCampaign() {
  createError.value = ''
  if (!cc.name) { createError.value = 'Campaign name is required.'; return }
  creating.value = true
  try {
    const newCamp = await campaign.createCampaign({ ...cc, invite_code: cc.invite_code?.toUpperCase() || null })
    showCreateModal.value = false
    ui.showToast(`Campaign "${newCamp.name}" created!`, '', '✓')
    await campaign.switchCampaign(newCamp.id)
    await data.loadAll()
    router.push('/dashboard')
  } catch (e) {
    createError.value = e.message || 'Failed to create'
  } finally {
    creating.value = false
  }
}
</script>
