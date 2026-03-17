<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">Settings</div></div>

    <!-- Profile -->
    <div class="settings-section">
      <div class="settings-section-title">Profile</div>
      <div class="field-group"><label>Character Name</label>
        <input v-model="charName" class="form-input" placeholder="Thorin Oakenshield" />
      </div>
      <div class="field-group"><label>Character Class</label>
        <input v-model="charClass" class="form-input" placeholder="Fighter" />
      </div>
      <button class="btn btn-primary" @click="saveProfile">Save Profile</button>
      <div v-if="profileStatus" :class="['status-msg', profileOk ? 'status-ok' : 'status-err']">{{ profileStatus }}</div>
    </div>

    <!-- Theme -->
    <div class="settings-section">
      <div class="settings-section-title">Theme</div>
      <div id="theme-swatches" style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px">
        <div
          v-for="(meta, key) in THEME_META"
          :key="key"
          class="theme-swatch"
          :class="{ active: currentTheme === key }"
          @click="applyTheme(key)"
        >
          <div class="theme-swatch-dot" :style="key === 'custom' ? 'background:linear-gradient(135deg,#c9a84c,#4caf7d,#4c7ac9)' : `background:${meta.color};box-shadow:0 0 8px ${meta.color}66`"></div>
          <div class="theme-swatch-name">{{ meta.name }}</div>
        </div>
      </div>

      <!-- Custom theme controls -->
      <div v-if="currentTheme === 'custom'" id="custom-theme-controls" style="margin-top:12px">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:10px;margin-bottom:10px">
          <div v-for="k in ['bg','surface','accent','text','border']" :key="k" class="field-group">
            <label>{{ k.charAt(0).toUpperCase() + k.slice(1) }}</label>
            <input type="color" v-model="customColors[k]" class="form-input" style="height:36px;padding:2px" @input="applyCustomTheme" />
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm btn-primary" @click="saveCustomTheme">Apply Custom Theme</button>
          <button class="btn btn-sm" @click="resetCustomTheme">Reset</button>
        </div>
      </div>
    </div>

    <!-- Background Image -->
    <div class="settings-section">
      <div class="settings-section-title">Background Image</div>
      <div class="field-group">
        <label>Image URL</label>
        <input v-model="bgUrl" class="form-input" placeholder="https://…" @input="previewBg" />
      </div>
      <div v-if="bgUrl" id="settings-bg-preview" style="width:100%;height:120px;background-size:cover;background-position:center;border-radius:4px;margin-bottom:8px;border:1px solid var(--border)" :style="`background-image:url(${JSON.stringify(bgUrl)})`"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <label class="btn btn-sm" style="cursor:pointer">
          Upload Image
          <input type="file" accept="image/*" style="display:none" @change="uploadBg" />
        </label>
        <button class="btn btn-sm btn-primary" @click="applyBg">Set Background</button>
        <button v-if="bgUrl" class="btn btn-sm btn-danger" @click="clearBg">Clear</button>
      </div>
    </div>

    <!-- Font Size -->
    <div class="settings-section">
      <div class="settings-section-title">Font Size</div>
      <div style="display:flex;gap:8px">
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
      <div style="display:flex;flex-direction:column;gap:10px">
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
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
const bgUrl = ref(localStorage.getItem('chronicle_bg_image') || '')
const fontSize = ref(localStorage.getItem('chronicle_font_size') || 'medium')
const currentTheme = ref(document.documentElement.getAttribute('data-theme') || 'dnd5e')

const a11y = reactive(JSON.parse(localStorage.getItem('chronicle_a11y') || '{}'))

const customColors = reactive(JSON.parse(localStorage.getItem('chronicle_custom_theme') || '{"bg":"#0d0d0f","surface":"#1a1a24","accent":"#c9a84c","text":"#e8e4d9","border":"#2a2a3a"}'))

const THEME_META = {
  dnd5e: { name: 'D&D 5e', color: '#c9a84c' },
  coc: { name: 'Call of Cthulhu', color: '#b8a060' },
  alien: { name: 'Alien', color: '#4caf7d' },
  coriolis: { name: 'Coriolis', color: '#6a8ad4' },
  dune: { name: 'Dune', color: '#d4a040' },
  achtung: { name: 'Achtung!', color: '#8a9e40' },
  custom: { name: 'Custom', color: '#c9a84c' },
}

onMounted(() => {
  if (auth.currentUser) {
    charName.value = auth.currentUser.character_name || ''
    charClass.value = auth.currentUser.character_class || ''
  }
})

function applyTheme(key) {
  currentTheme.value = key
  campaign.applyTheme(key)
}

function applyCustomTheme() {
  localStorage.setItem('chronicle_custom_theme', JSON.stringify({ ...customColors }))
  campaign.applyCustomTheme()
}

function saveCustomTheme() {
  applyCustomTheme()
  ui.showToast('Custom theme applied', '', '🎨')
}

function resetCustomTheme() {
  localStorage.removeItem('chronicle_custom_theme')
  Object.assign(customColors, { bg: '#0d0d0f', surface: '#1a1a24', accent: '#c9a84c', text: '#e8e4d9', border: '#2a2a3a' })
  applyCustomTheme()
}

async function saveProfile() {
  const r = await data.apif('/api/profile', {
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

function previewBg() {}

async function uploadBg(e) {
  const file = e.target.files[0]
  if (!file) return
  const fd = new FormData()
  fd.append('file', file)
  const r = await fetch('/api/uploads', { method: 'POST', headers: { Authorization: `Bearer ${auth.token}` }, body: fd })
  if (r.ok) {
    const d = await r.json()
    bgUrl.value = d.url
    applyBg()
  } else {
    ui.showToast('Upload failed', '', '✕')
  }
}

function applyBg() {
  localStorage.setItem('chronicle_bg_image', bgUrl.value)
  const main = document.getElementById('main')
  if (main) {
    main.style.backgroundImage = `url(${JSON.stringify(bgUrl.value)})`
    main.classList.add('has-bg-image')
  }
  ui.showToast('Background set', '', '✓')
}

function clearBg() {
  bgUrl.value = ''
  localStorage.removeItem('chronicle_bg_image')
  const main = document.getElementById('main')
  if (main) { main.style.backgroundImage = ''; main.classList.remove('has-bg-image') }
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
