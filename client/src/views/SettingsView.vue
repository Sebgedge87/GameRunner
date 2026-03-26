<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">Settings</div></div>

    <div class="settings-cols">

      <!-- ── LEFT COLUMN ───────────────────────────────── -->
      <div class="settings-col">

        <!-- Profile -->
        <div class="settings-section">
          <div class="settings-section-title">Profile</div>
          <div class="field-group">
            <label>Character Name</label>
            <input v-model="charName" class="form-input" placeholder="Thorin Oakenshield" />
          </div>
          <div class="field-group">
            <label>Character Class</label>
            <input v-model="charClass" class="form-input" placeholder="Fighter" />
          </div>
          <button class="btn btn-primary" @click="saveProfile">Save Profile</button>
          <div v-if="profileStatus" :class="['status-msg', profileOk ? 'status-ok' : 'status-err']">{{ profileStatus }}</div>
        </div>

        <!-- Font Size -->
        <div class="settings-section">
          <div class="settings-section-title">Font Size</div>
          <div class="font-sz-row">
            <button
              v-for="sz in ['small','medium','large']"
              :key="sz"
              class="font-sz-btn filter-tab"
              :data-sz="sz"
              :class="{ active: fontSize === sz }"
              @click="setFontSize(sz)"
            >{{ sz }}</button>
          </div>
        </div>

        <!-- Accessibility -->
        <div class="settings-section">
          <div class="settings-section-title">Accessibility</div>
          <div class="a11y-list">
            <label class="check-row">
              <input type="checkbox" v-model="a11y.contrast" @change="setA11y('contrast', a11y.contrast)" />
              High Contrast
            </label>
            <label class="check-row">
              <input type="checkbox" v-model="a11y.motion" @change="setA11y('motion', a11y.motion)" />
              Reduce Motion
            </label>
            <label class="check-row">
              <input type="checkbox" v-model="a11y.effects" @change="setA11y('effects', a11y.effects)" />
              Disable Effects
            </label>
          </div>
        </div>

        <!-- Backup (GM only) -->
        <div v-if="campaign.isGm" class="settings-section">
          <div class="settings-section-title">Backup</div>
          <button class="btn btn-primary" @click="downloadBackup">Download Backup</button>
        </div>

      </div><!-- /left col -->

      <!-- ── RIGHT COLUMN ──────────────────────────────── -->
      <div class="settings-col">

        <!-- Theme -->
        <div class="settings-section">
          <div class="settings-section-title">Theme</div>
          <div class="theme-swatches">
            <div
              v-for="(meta, key) in THEME_META"
              :key="key"
              class="theme-swatch"
              :class="{ active: currentTheme === key }"
              @click="applyTheme(key)"
            >
              <div class="theme-swatch-dot" :style="swatchDotStyle(key, meta)"></div>
              <div class="theme-swatch-name">{{ meta.name }}</div>
            </div>
          </div>

          <!-- Custom theme controls -->
          <div v-if="currentTheme === 'custom'" class="custom-theme-controls">
            <div class="custom-colors-grid">
              <div v-for="k in ['bg','surface','accent','text','border']" :key="k" class="field-group">
                <label>{{ k.charAt(0).toUpperCase() + k.slice(1) }}</label>
                <input type="color" v-model="customColors[k]" class="form-input color-input" @input="applyCustomTheme" />
              </div>
            </div>
            <div class="custom-theme-actions">
              <button class="btn btn-sm btn-primary" @click="saveCustomTheme">Apply Custom Theme</button>
              <button class="btn btn-sm" @click="resetCustomTheme">Reset</button>
            </div>
          </div>
        </div>

        <!-- Change Password -->
        <div class="settings-section">
          <div class="settings-section-title">Change Password</div>
          <div class="field-group">
            <label>Current Password</label>
            <input v-model="pwCurrent" type="password" class="form-input" autocomplete="current-password" />
          </div>
          <div class="field-group">
            <label>New Password</label>
            <input v-model="pwNew" type="password" class="form-input" autocomplete="new-password" />
          </div>
          <div class="field-group">
            <label>Confirm New Password</label>
            <input v-model="pwConfirm" type="password" class="form-input" autocomplete="new-password" />
          </div>
          <button class="btn btn-primary" @click="changePassword">Change Password</button>
          <div v-if="pwStatus" :class="['status-msg', pwOk ? 'status-ok' : 'status-err']">{{ pwStatus }}</div>
        </div>

      </div><!-- /right col -->
    </div><!-- /settings-cols -->
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import { useDataStore } from '@/stores/data'

const auth = useAuthStore()
const campaign = useCampaignStore()
const ui = useUiStore()
const data = useDataStore()

const charName = ref('')
const charClass = ref('')
const profileStatus = ref('')
const profileOk = ref(false)
const fontSize = ref(localStorage.getItem('chronicle_font_size') || 'medium')
const currentTheme = ref(document.documentElement.getAttribute('data-theme') || 'default')

const a11y = reactive(JSON.parse(localStorage.getItem('chronicle_a11y') || '{}'))
const customColors = reactive(JSON.parse(localStorage.getItem('chronicle_custom_theme') || '{"bg":"#0d0d0f","surface":"#1a1a24","accent":"#c9a84c","text":"#e8e4d9","border":"#2a2a3a"}'))

const THEME_META = {
  default:  { name: 'Default',         color: '#6b8cff' },
  dnd5e:    { name: 'D&D 5e',          color: '#c9a84c' },
  coc:      { name: 'Call of Cthulhu', color: '#b8a060' },
  alien:    { name: 'Alien',           color: '#4caf7d' },
  coriolis: { name: 'Coriolis',        color: '#6a8ad4' },
  dune:     { name: 'Dune',            color: '#d4a040' },
  achtung:  { name: 'Achtung!',        color: '#8a9e40' },
  custom:   { name: 'Custom',          color: '#c9a84c' },
}

function swatchDotStyle(key, meta) {
  if (key === 'custom') return 'background:linear-gradient(135deg,#c9a84c,#4caf7d,#4c7ac9)'
  return `background:${meta.color};box-shadow:0 0 8px ${meta.color}66`
}

const pwCurrent = ref('')
const pwNew = ref('')
const pwConfirm = ref('')
const pwStatus = ref('')
const pwOk = ref(false)

onMounted(() => {
  if (auth.currentUser) {
    charName.value = auth.currentUser.character_name || ''
    charClass.value = auth.currentUser.character_class || ''
  }
})

function applyTheme(key) {
  currentTheme.value = key
  campaign.applyTheme(key)
  auth.savePreferences({ theme: key })
}

function applyCustomTheme() {
  localStorage.setItem('chronicle_custom_theme', JSON.stringify({ ...customColors }))
  campaign.applyCustomTheme()
}

function saveCustomTheme() {
  applyCustomTheme()
  auth.savePreferences({ theme: 'custom', custom_colors: { ...customColors } })
  ui.showToast('Custom theme applied', '', '🎨')
}

function resetCustomTheme() {
  localStorage.removeItem('chronicle_custom_theme')
  Object.assign(customColors, { bg: '#0d0d0f', surface: '#1a1a24', accent: '#c9a84c', text: '#e8e4d9', border: '#2a2a3a' })
  applyCustomTheme()
}

async function saveProfile() {
  const r = await data.apif('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify({ character_name: charName.value, character_class: charClass.value }),
  })
  if (r.ok) {
    if (auth.currentUser) {
      auth.currentUser.character_name = charName.value
      auth.currentUser.character_class = charClass.value
    }
    profileStatus.value = 'Saved.'
    profileOk.value = true
  } else {
    profileStatus.value = 'Save failed.'
    profileOk.value = false
  }
}

function setFontSize(sz) {
  fontSize.value = sz
  localStorage.setItem('chronicle_font_size', sz)
  document.body.setAttribute('data-font-size', sz)
}

function setA11y(key, val) {
  const saved = JSON.parse(localStorage.getItem('chronicle_a11y') || '{}')
  saved[key] = val
  localStorage.setItem('chronicle_a11y', JSON.stringify(saved))
  if (key === 'contrast') document.body.classList.toggle('high-contrast', val)
  if (key === 'motion') document.body.classList.toggle('reduce-motion', val)
  if (key === 'effects') document.body.classList.toggle('no-effects', val)
}

async function changePassword() {
  pwStatus.value = ''
  if (!pwCurrent.value || !pwNew.value) { pwStatus.value = 'All fields required.'; pwOk.value = false; return }
  if (pwNew.value.length < 6) { pwStatus.value = 'New password must be at least 6 characters.'; pwOk.value = false; return }
  if (pwNew.value !== pwConfirm.value) { pwStatus.value = 'Passwords do not match.'; pwOk.value = false; return }
  const r = await data.apif('/api/users/me/password', {
    method: 'PUT',
    body: JSON.stringify({ current_password: pwCurrent.value, new_password: pwNew.value }),
  })
  if (r.ok) {
    pwStatus.value = 'Password changed.'; pwOk.value = true
    pwCurrent.value = ''; pwNew.value = ''; pwConfirm.value = ''
  } else {
    const d = await r.json().catch(() => ({}))
    pwStatus.value = d.error || 'Failed.'; pwOk.value = false
  }
}

async function downloadBackup() {
  const r = await data.apif('/api/backup')
  if (r.ok) {
    const blob = await r.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chronicle-backup-${new Date().toISOString().slice(0, 10)}.zip`
    a.click()
    URL.revokeObjectURL(url)
  } else {
    ui.showToast('Backup failed', '', '✕')
  }
}
</script>

<style scoped>
/* 2-column layout */
.settings-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

/* Theme */
.theme-swatches { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
.custom-theme-controls { margin-top: 12px; }
.custom-colors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}
.color-input { height: 36px; padding: 2px; }
.custom-theme-actions { display: flex; gap: 8px; }

/* Font size */
.font-sz-row { display: flex; gap: 8px; }

/* Accessibility */
.a11y-list { display: flex; flex-direction: column; gap: 10px; }

@media (max-width: 860px) {
  .settings-cols { grid-template-columns: 1fr; }
}
</style>
