<template>
  <!-- ── Dev Auth Gate ─────────────────────────────────────────── -->
  <div v-if="!authed" class="dev-gate">
    <div class="dev-gate-box">
      <div class="dev-gate-title">SYSTEM ADMINISTRATOR</div>
      <div class="dev-gate-sub">Gamerunner Developer Portal</div>
      <form @submit.prevent="attemptLogin" class="dev-gate-form">
        <div class="dev-field">
          <label>Username</label>
          <input v-model="loginForm.username" type="text" autocomplete="username" spellcheck="false" />
        </div>
        <div class="dev-field">
          <label>Password</label>
          <input v-model="loginForm.password" type="password" autocomplete="current-password" />
        </div>
        <div v-if="loginError" class="dev-error">{{ loginError }}</div>
        <button type="submit" class="dev-btn">Authenticate</button>
      </form>
    </div>
  </div>

  <!-- ── Developer Portal ──────────────────────────────────────── -->
  <div v-else class="dev-portal">
    <div class="dev-portal-header">
      <div>
        <div class="dev-portal-title">Developer Configuration Portal</div>
        <div class="dev-portal-sub">Gamerunner · System Admin</div>
      </div>
      <button class="dev-btn dev-btn-sm dev-btn-ghost" @click="logout">Sign out</button>
    </div>

    <!-- ── Media Configurator ─────────────────────────────────── -->
    <section class="dev-section">
      <div class="dev-section-title">Media Configurator</div>
      <div class="dev-section-desc">
        Manage SVG strings and image URLs for system-specific immersion assets.
        Changes are saved to <code>localStorage</code> and applied immediately.
      </div>

      <div class="dev-asset-grid">
        <div v-for="asset in assetSlots" :key="asset.key" class="dev-asset-card">
          <div class="dev-asset-header">
            <span class="dev-asset-key">{{ asset.key }}</span>
            <span class="dev-asset-label">{{ asset.label }}</span>
          </div>
          <div class="dev-asset-type-row">
            <label class="dev-radio">
              <input type="radio" :name="`type-${asset.key}`" value="url" v-model="mediaConfig[asset.key].type" @change="saveConfig" />
              Image URL
            </label>
            <label class="dev-radio">
              <input type="radio" :name="`type-${asset.key}`" value="svg" v-model="mediaConfig[asset.key].type" @change="saveConfig" />
              SVG String
            </label>
            <label class="dev-radio">
              <input type="radio" :name="`type-${asset.key}`" value="css" v-model="mediaConfig[asset.key].type" @change="saveConfig" />
              CSS Gradient
            </label>
          </div>
          <textarea
            v-model="mediaConfig[asset.key].value"
            class="dev-asset-input"
            :placeholder="asset.placeholder"
            rows="3"
            @input="saveConfig"
          />
          <div class="dev-asset-preview">
            <span class="dev-asset-preview-label">Preview</span>
            <div class="dev-asset-preview-box" :style="previewStyle(asset.key)">
              <span v-if="!mediaConfig[asset.key].value" class="dev-asset-empty">—</span>
            </div>
          </div>
        </div>
      </div>

      <div class="dev-actions">
        <button class="dev-btn" @click="saveConfig">Save All</button>
        <button class="dev-btn dev-btn-ghost" @click="resetConfig">Reset to Defaults</button>
        <span class="dev-save-status" :class="saveStatus">{{ saveStatusText }}</span>
      </div>
    </section>

    <!-- ── Raw Config Inspector ───────────────────────────────── -->
    <section class="dev-section">
      <div class="dev-section-title">Raw Config</div>
      <div class="dev-section-desc">Current <code>media_config</code> stored in localStorage.</div>
      <pre class="dev-raw">{{ JSON.stringify(mediaConfig, null, 2) }}</pre>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'

// ── Auth ────────────────────────────────────────────────────────
const DEV_USER = 'system administrator'
const DEV_PASS = 'Akthos12@'
const SESSION_KEY = 'gamerunner_dev_session'
const CONFIG_KEY  = 'gamerunner_media_config'

const authed = ref(false)
const loginForm = reactive({ username: '', password: '' })
const loginError = ref('')

function attemptLogin() {
  if (loginForm.username === DEV_USER && loginForm.password === DEV_PASS) {
    const sessionToken = `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`
    localStorage.setItem(SESSION_KEY, sessionToken)
    authed.value = true
    loginError.value = ''
  } else {
    loginError.value = 'Invalid credentials.'
  }
}

function logout() {
  localStorage.removeItem(SESSION_KEY)
  authed.value = false
  loginForm.username = ''
  loginForm.password = ''
}

// ── Asset slot definitions ──────────────────────────────────────
const assetSlots = [
  { key: 'alien_slime',   label: 'Alien Slime Texture',      system: 'alien',    placeholder: 'https://… or <svg>…' },
  { key: 'dune_sand',     label: 'Dune Sand Texture',        system: 'dune',     placeholder: 'https://… or <svg>…' },
  { key: 'achtung_knife', label: 'Achtung! Knife / WW2',     system: 'achtung',  placeholder: 'https://… or <svg>…' },
  { key: 'coc_tome',      label: 'CoC Tome / Tentacle',      system: 'coc',      placeholder: 'https://… or <svg>…' },
  { key: 'dnd_dragon',    label: 'D&D Dragon / Fantasy',     system: 'dnd5e',    placeholder: 'https://… or <svg>…' },
  { key: 'scifi_grid',    label: 'Sci-Fi Grid / Star',       system: 'scifi',    placeholder: 'https://… or <svg>…' },
  { key: 'global_bg',     label: 'Global Background',        system: null,       placeholder: 'https://… or CSS gradient value' },
  { key: 'global_noise',  label: 'Global Noise / Texture',   system: null,       placeholder: 'https://… or <svg>…' },
]

// ── Media config state ──────────────────────────────────────────
const defaultEntry = () => ({ type: 'url', value: '' })

function buildDefault() {
  return Object.fromEntries(assetSlots.map(a => [a.key, defaultEntry()]))
}

const mediaConfig = reactive(buildDefault())

function loadConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    for (const key of Object.keys(mediaConfig)) {
      if (parsed[key]) {
        mediaConfig[key].type  = parsed[key].type  ?? 'url'
        mediaConfig[key].value = parsed[key].value ?? ''
      }
    }
  } catch (_) {}
}

// ── Save ────────────────────────────────────────────────────────
const saveStatus = ref('')
const saveStatusText = computed(() => {
  if (saveStatus.value === 'saved') return 'Saved ✓'
  if (saveStatus.value === 'saving') return 'Saving…'
  return ''
})

let _saveTimer = null
function saveConfig() {
  saveStatus.value = 'saving'
  clearTimeout(_saveTimer)
  _saveTimer = setTimeout(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(mediaConfig))
    saveStatus.value = 'saved'
    setTimeout(() => { saveStatus.value = '' }, 2000)
  }, 400)
}

function resetConfig() {
  const defaults = buildDefault()
  for (const key of Object.keys(mediaConfig)) {
    mediaConfig[key].type  = defaults[key].type
    mediaConfig[key].value = defaults[key].value
  }
  saveConfig()
}

// ── Preview ─────────────────────────────────────────────────────
function previewStyle(key) {
  const entry = mediaConfig[key]
  if (!entry.value) return {}
  if (entry.type === 'url') return { backgroundImage: `url(${entry.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  if (entry.type === 'css') return { background: entry.value }
  if (entry.type === 'svg') {
    const enc = encodeURIComponent(entry.value)
    return { backgroundImage: `url("data:image/svg+xml,${enc}")`, backgroundSize: 'cover' }
  }
  return {}
}

// ── Init ────────────────────────────────────────────────────────
onMounted(() => {
  authed.value = !!localStorage.getItem(SESSION_KEY)
  loadConfig()
})
</script>

<style scoped>
/* ── Gate ─────────────────────────────────────────────────── */
.dev-gate {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0f;
}
.dev-gate-box {
  width: 360px;
  background: #111118;
  border: 1px solid #2a2a3a;
  border-radius: 6px;
  padding: 40px 36px;
}
.dev-gate-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7em;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #5a9cf5;
  margin-bottom: 4px;
}
.dev-gate-sub {
  font-size: 1.15em;
  font-weight: 600;
  color: #e0e0f0;
  margin-bottom: 28px;
}
.dev-gate-form { display: flex; flex-direction: column; gap: 14px; }
.dev-field { display: flex; flex-direction: column; gap: 5px; }
.dev-field label { font-size: 0.7em; letter-spacing: 0.1em; text-transform: uppercase; color: #6060a0; font-family: 'JetBrains Mono', monospace; }
.dev-field input {
  background: #0d0d16;
  border: 1px solid #2a2a40;
  border-radius: 3px;
  color: #d0d0f0;
  padding: 8px 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
}
.dev-field input:focus { outline: none; border-color: #5a9cf5; }
.dev-error { font-size: 0.8em; color: #e05555; font-family: 'JetBrains Mono', monospace; }

/* ── Shared buttons ───────────────────────────────────────── */
.dev-btn {
  background: #1a1a60;
  border: 1px solid #3a3ab0;
  border-radius: 3px;
  color: #9090f0;
  padding: 9px 18px;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78em;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: background 0.15s, color 0.15s;
}
.dev-btn:hover { background: #22228a; color: #c0c0ff; }
.dev-btn-ghost { background: transparent; border-color: #2a2a3a; color: #6060a0; }
.dev-btn-ghost:hover { background: #12121a; color: #a0a0c0; }
.dev-btn-sm { padding: 5px 12px; font-size: 0.72em; }

/* ── Portal layout ────────────────────────────────────────── */
.dev-portal {
  min-height: 100vh;
  background: #0a0a0f;
  color: #c0c0d8;
  padding: 32px;
  font-family: 'JetBrains Mono', monospace;
}
.dev-portal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 36px;
  padding-bottom: 20px;
  border-bottom: 1px solid #1a1a2a;
}
.dev-portal-title {
  font-size: 1.2em;
  font-weight: 700;
  color: #d0d0f0;
  letter-spacing: 0.04em;
}
.dev-portal-sub {
  font-size: 0.7em;
  color: #4a4a70;
  letter-spacing: 0.1em;
  margin-top: 3px;
}

/* ── Sections ─────────────────────────────────────────────── */
.dev-section {
  background: #0e0e18;
  border: 1px solid #1e1e30;
  border-radius: 5px;
  padding: 24px;
  margin-bottom: 24px;
}
.dev-section-title {
  font-size: 0.72em;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #5a9cf5;
  margin-bottom: 6px;
}
.dev-section-desc {
  font-size: 0.78em;
  color: #4a4a70;
  margin-bottom: 20px;
  line-height: 1.6;
}
.dev-section-desc code {
  background: #151520;
  border: 1px solid #2a2a3a;
  border-radius: 2px;
  padding: 1px 5px;
  color: #8080c0;
  font-size: 0.95em;
}

/* ── Asset grid ───────────────────────────────────────────── */
.dev-asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.dev-asset-card {
  background: #0a0a14;
  border: 1px solid #1a1a28;
  border-radius: 4px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dev-asset-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.dev-asset-key {
  font-size: 0.72em;
  color: #5a9cf5;
  letter-spacing: 0.08em;
  background: #101020;
  border: 1px solid #2a2a44;
  border-radius: 2px;
  padding: 1px 6px;
}
.dev-asset-label {
  font-size: 0.78em;
  color: #6a6a90;
}
.dev-asset-type-row {
  display: flex;
  gap: 14px;
}
.dev-radio {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72em;
  color: #5a5a80;
  cursor: pointer;
}
.dev-radio input { accent-color: #5a9cf5; cursor: pointer; }
.dev-asset-input {
  background: #0d0d1a;
  border: 1px solid #1e1e32;
  border-radius: 3px;
  color: #a0a0c8;
  padding: 7px 9px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72em;
  resize: vertical;
  line-height: 1.5;
}
.dev-asset-input:focus { outline: none; border-color: #3a3a80; }
.dev-asset-preview { display: flex; flex-direction: column; gap: 4px; }
.dev-asset-preview-label { font-size: 0.65em; letter-spacing: 0.1em; color: #3a3a55; text-transform: uppercase; }
.dev-asset-preview-box {
  height: 56px;
  background: #0d0d18;
  border: 1px solid #1a1a28;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dev-asset-empty { font-size: 0.8em; color: #2a2a40; }

/* ── Actions ──────────────────────────────────────────────── */
.dev-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dev-save-status {
  font-size: 0.72em;
  letter-spacing: 0.08em;
  opacity: 0;
  transition: opacity 0.2s;
}
.dev-save-status.saved  { opacity: 1; color: #4caf7d; }
.dev-save-status.saving { opacity: 1; color: #6060a0; }

/* ── Raw inspector ────────────────────────────────────────── */
.dev-raw {
  background: #0a0a12;
  border: 1px solid #1a1a26;
  border-radius: 3px;
  padding: 14px;
  font-size: 0.72em;
  color: #5a7a5a;
  overflow: auto;
  max-height: 320px;
  line-height: 1.6;
  margin: 0;
}
</style>
