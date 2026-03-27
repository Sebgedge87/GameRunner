<template>
  <div v-if="show" id="onboarding-overlay">
    <div class="wizard-box">
      <div class="wizard-title">WELCOME, GM</div>
      <div class="wizard-sub">Let's set up your campaign</div>

      <div class="wizard-steps-indicator">
        <div v-for="(label, i) in ['Campaign', 'Players', 'Ready']" :key="i" class="wizard-step-item">
          <div class="wizard-step-dot" :class="{ active: step === i, done: step > i }"></div>
          <div class="wizard-step-label" :class="{ active: step === i }">{{ label }}</div>
        </div>
      </div>

      <!-- Step 0: Campaign -->
      <div v-if="step === 0">
        <div class="field-group">
          <label>Campaign Name</label>
          <input v-model="campName" class="form-input" placeholder="The Shattered Crown" />
        </div>
        <div class="field-group">
          <label>System</label>
          <select v-model="campSystem" class="form-input" @change="previewTheme">
            <option value="default">Default (no system)</option>
            <option value="dnd5e">D&amp;D 5e</option>
            <option value="coc">Call of Cthulhu</option>
            <option value="alien">Alien RPG</option>
            <option value="coriolis">Coriolis</option>
            <option value="dune">Dune</option>
            <option value="achtung">Achtung! Cthulhu</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-top:4px">Theme preview applied — you can change it later in Settings.</div>
      </div>

      <!-- Step 1: First player -->
      <div v-else-if="step === 1">
        <p style="color:var(--text2);font-size:13px;line-height:1.7;margin-bottom:14px">
          Optionally invite your first player. They'll receive a username/password to log in.
        </p>
        <div class="field-group">
          <label>Player Username <small style="opacity:0.5">(optional)</small></label>
          <input v-model="playerName" class="form-input" placeholder="aragorn42" />
        </div>
        <div class="field-group">
          <label>Temporary Password</label>
          <input v-model="playerPwd" class="form-input" type="password" placeholder="letmein123" />
        </div>
      </div>

      <!-- Step 2: Ready -->
      <div v-else>
        <div style="background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:14px 16px;margin-bottom:16px">
          <div style="font-size:12px;color:var(--text3);font-family:var(--font-sans);margin-bottom:4px">Campaign</div>
          <div style="font-size:16px;color:var(--accent);font-family:var(--font-header,'Cinzel',serif)">{{ campName }}</div>
        </div>
        <p style="color:var(--text2);font-size:13px;line-height:1.7;margin-bottom:14px">
          Your campaign is ready. Share your server address with players so they can log in.
        </p>
        <div style="font-size:12px;color:var(--text3);font-family:'JetBrains Mono',monospace">
          Server: <b style="color:var(--accent)">{{ serverUrl }}</b>
        </div>
      </div>

      <div v-if="errMsg" class="status-msg status-err" style="margin-top:8px">{{ errMsg }}</div>

      <div class="wizard-nav">
        <button v-if="step > 0" class="modal-close" @click="back">← Back</button>
        <button class="submit-btn" @click="next" :disabled="busy">
          {{ busy ? 'Please wait…' : step >= 2 ? 'Enter Chronicle' : 'Next →' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCampaignStore } from '@/stores/campaign'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'

const campaign = useCampaignStore()
const data = useDataStore()
const auth = useAuthStore()

const show = ref(false)
const step = ref(0)
const campName = ref('')
const campSystem = ref('default')
const playerName = ref('')
const playerPwd = ref('')
const busy = ref(false)
const errMsg = ref('')

const serverUrl = computed(() => `${location.protocol}//${location.hostname}:3000`)

// Show wizard if GM with no campaigns and not yet onboarded
watch(
  () => auth.isAuthenticated,
  async (authed) => {
    if (!authed) return
    if (localStorage.getItem('chronicle_onboarded')) return
    if (auth.currentUser?.role !== 'gm') return
    // Wait for campaigns to load
    if (!campaign.allCampaigns.length) await campaign.loadCampaigns()
    if (!campaign.allCampaigns.length) show.value = true
  },
  { immediate: true }
)

function previewTheme() {
  campaign.applyTheme(campSystem.value)
}

async function next() {
  errMsg.value = ''
  busy.value = true
  try {
    if (step.value === 0) {
      if (!campName.value.trim()) { errMsg.value = 'Campaign name required.'; return }
      const r = await data.apif('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({ name: campName.value.trim(), system: campSystem.value, description: '' }),
      })
      if (!r.ok) { errMsg.value = 'Failed to create campaign.'; return }
      await campaign.loadCampaigns()
      campaign.applyTheme(campSystem.value)
      step.value++
    } else if (step.value === 1) {
      if (playerName.value.trim() && playerPwd.value.trim()) {
        const r = await data.apif('/api/users/invite', {
          method: 'POST',
          body: JSON.stringify({ username: playerName.value.trim(), password: playerPwd.value.trim(), role: 'player' }),
        })
        if (!r.ok) { errMsg.value = 'Player invite failed (username may be taken).'; return }
      }
      step.value++
    } else {
      // Finish
      localStorage.setItem('chronicle_onboarded', '1')
      show.value = false
      await data.loadAll()
    }
  } finally {
    busy.value = false
  }
}

function back() {
  if (step.value > 0) step.value--
  errMsg.value = ''
}
</script>

<style scoped>
#onboarding-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-bg-overlay-heavy);
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wizard-box {
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 10px;
  padding: 36px 40px;
  width: 420px;
  max-width: 95vw;
  box-shadow: 0 20px 60px var(--color-bg-overlay-medium);
}
.wizard-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.3em;
  font-weight: 700;
  letter-spacing: .1em;
  color: var(--accent);
  margin-bottom: 4px;
}
.wizard-sub {
  font-size: 0.85em;
  color: var(--text3);
  margin-bottom: 24px;
}
.wizard-steps-indicator {
  display: flex;
  gap: 0;
  margin-bottom: 28px;
  align-items: center;
}
.wizard-step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  position: relative;
}
.wizard-step-item:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: var(--border2);
  z-index: 0;
}
.wizard-step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--border2);
  transition: background 0.2s;
  z-index: 1;
  position: relative;
}
.wizard-step-dot.active { background: var(--accent); }
.wizard-step-dot.done { background: var(--accent); opacity: 0.5; }
.wizard-step-label {
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text3);
  letter-spacing: 0.05em;
  transition: color 0.2s;
}
.wizard-step-label.active { color: var(--accent); }
.wizard-nav {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}
</style>
