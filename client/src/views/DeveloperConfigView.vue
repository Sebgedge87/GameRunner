<template>
  <div class="dev-root" data-theme="dev">
    <!-- ── Auth Gate ──────────────────────────────────────────────────── -->
    <div v-if="!authed" class="dev-login-wrap">
      <form class="dev-login-form" @submit.prevent="attemptLogin">
        <div class="dev-login-header">
          <span class="dev-login-icon">⬡</span>
          <div class="dev-login-title">System configuration</div>
          <div class="dev-login-sub">Developer Access Only</div>
        </div>
        <label class="dev-field-label">Username</label>
        <input
          v-model="loginUser"
          class="dev-input"
          type="text"
          autocomplete="off"
          spellcheck="false"
          placeholder="system administrator"
        />
        <label class="dev-field-label">Password</label>
        <input
          v-model="loginPass"
          class="dev-input"
          type="password"
          autocomplete="off"
        />
        <div v-if="loginError" class="dev-login-error">{{ loginError }}</div>
        <button type="submit" class="dev-btn dev-btn-primary" :disabled="loginBusy">
          {{ loginBusy ? 'Verifying…' : 'Authenticate' }}
        </button>
      </form>
    </div>

    <!-- ── Configurator ───────────────────────────────────────────────── -->
    <div v-else class="dev-shell">
      <header class="dev-header">
        <span class="dev-header-icon">⬡</span>
        <span class="dev-header-title">CHRONICLE · DEV CONFIG</span>
        <span class="dev-header-build">build {{ buildStamp }}</span>
        <button class="dev-btn dev-btn-ghost dev-logout" @click="logout">⇥ End Session</button>
      </header>

      <div class="dev-body">
        <!-- Left: section nav -->
        <nav class="dev-sidenav">
          <button
            v-for="sec in sections"
            :key="sec.id"
            class="dev-sidenav-item"
            :class="{ active: activeSec === sec.id }"
            @click="activeSec = sec.id"
          >
            <span class="dev-sidenav-icon">{{ sec.icon }}</span>{{ sec.label }}
          </button>
        </nav>

        <!-- Right: panels -->
        <main class="dev-panel">

          <!-- ── Immersion Assets ── -->
          <section v-if="activeSec === 'assets'" class="dev-section">
            <h2 class="dev-section-title">Immersion Layer Assets</h2>
            <p class="dev-section-desc">Update file paths or raw SVG strings for per-system VFX elements. Changes are persisted to localStorage and picked up by ImmersionOverlay on next mount.</p>

            <div v-for="asset in assetDefs" :key="asset.key" class="dev-asset-block">
              <div class="dev-asset-header">
                <span class="dev-asset-system">{{ asset.system }}</span>
                <span class="dev-asset-name">{{ asset.name }}</span>
                <span class="dev-asset-type">{{ asset.type }}</span>
              </div>
              <textarea
                class="dev-textarea"
                rows="3"
                :placeholder="asset.placeholder"
                :value="assetValues[asset.key]"
                @input="assetValues[asset.key] = $event.target.value"
              />
              <div class="dev-asset-actions">
                <button class="dev-btn dev-btn-sm" @click="saveAsset(asset.key)">Save</button>
                <button class="dev-btn dev-btn-sm dev-btn-ghost" @click="clearAsset(asset.key)">Clear</button>
                <span v-if="savedKeys.has(asset.key)" class="dev-saved-badge">✓ Saved</span>
              </div>
            </div>
          </section>

          <!-- ── CSS Variables ── -->
          <section v-if="activeSec === 'vars'" class="dev-section">
            <h2 class="dev-section-title">Global CSS Variables</h2>
            <p class="dev-section-desc">Tweak design tokens live. Changes apply immediately to <code>document.documentElement</code> and are persisted to localStorage.</p>

            <div class="dev-vars-grid">
              <div v-for="v in cssVarDefs" :key="v.prop" class="dev-var-row">
                <label class="dev-var-label">{{ v.label }}</label>
                <code class="dev-var-prop">{{ v.prop }}</code>
                <div class="dev-var-controls">
                  <input
                    v-if="v.type === 'color'"
                    type="color"
                    class="dev-color-picker"
                    :value="liveVars[v.prop] || v.default"
                    @input="setLiveVar(v.prop, $event.target.value)"
                  />
                  <input
                    class="dev-var-input"
                    type="text"
                    :value="liveVars[v.prop] || v.default"
                    @input="setLiveVar(v.prop, $event.target.value)"
                    :placeholder="v.default"
                  />
                </div>
                <button class="dev-btn dev-btn-xs dev-btn-ghost" @click="resetVar(v.prop, v.default)">Reset</button>
              </div>
            </div>

            <div class="dev-vars-actions">
              <button class="dev-btn dev-btn-primary" @click="persistVars">Persist All</button>
              <button class="dev-btn dev-btn-ghost" @click="resetAllVars">Reset All</button>
              <span v-if="varsSaved" class="dev-saved-badge">✓ Persisted to localStorage</span>
            </div>
          </section>

          <!-- ── Database Inspector ── -->
          <section v-if="activeSec === 'db'" class="dev-section">
            <h2 class="dev-section-title">Database Inspector</h2>
            <p class="dev-section-desc">Read-only <code>SELECT</code> queries against the live SQLite database. Write statements are blocked server-side.</p>

            <!-- Quick queries -->
            <div class="dev-quick-queries">
              <span class="dev-quick-label">Quick:</span>
              <button v-for="q in quickQueries" :key="q.label" class="dev-btn dev-btn-xs dev-btn-ghost" @click="runQuick(q.sql)">{{ q.label }}</button>
            </div>

            <!-- Editor -->
            <div class="dev-db-editor">
              <textarea
                v-model="dbQuery"
                class="dev-textarea dev-db-input"
                spellcheck="false"
                placeholder="SELECT * FROM users LIMIT 20;"
                @keydown.ctrl.enter.prevent="runQuery"
                @keydown.meta.enter.prevent="runQuery"
              />
              <div class="dev-db-toolbar">
                <button class="dev-btn dev-btn-primary dev-btn-sm" @click="runQuery" :disabled="dbLoading">
                  {{ dbLoading ? 'Running…' : '▶ Run' }}
                </button>
                <span class="dev-db-hint">Ctrl+Enter to run</span>
                <span v-if="dbError" class="dev-error-msg">{{ dbError }}</span>
              </div>
            </div>

            <!-- Results -->
            <div v-if="dbResult" class="dev-db-results">
              <div class="dev-db-results-meta">{{ dbResult.count }} row{{ dbResult.count !== 1 ? 's' : '' }}</div>
              <div class="dev-db-table-wrap">
                <table class="dev-db-table">
                  <thead>
                    <tr>
                      <th v-for="col in dbResult.columns" :key="col">{{ col }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, i) in dbResult.rows" :key="i">
                      <td v-for="col in dbResult.columns" :key="col">{{ row[col] ?? 'NULL' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <!-- ── User Management ── -->
          <section v-if="activeSec === 'users'" class="dev-section">
            <h2 class="dev-section-title">User Management</h2>
            <p class="dev-section-desc">All registered accounts. Password resets invalidate existing sessions. Deletion is permanent and cannot be undone.</p>

            <div class="dev-users-toolbar">
              <button class="dev-btn dev-btn-sm" @click="loadUsers" :disabled="usersLoading">
                {{ usersLoading ? 'Loading…' : '↻ Refresh' }}
              </button>
              <span v-if="usersError" class="dev-error-msg">{{ usersError }}</span>
            </div>

            <div v-if="usersLoading" class="dev-users-empty">Loading users…</div>
            <div v-else-if="!users.length" class="dev-users-empty">No users found.</div>
            <div v-else class="dev-users-table">
              <div class="dev-users-header">
                <span>ID</span>
                <span>Username</span>
                <span>Role</span>
                <span>Character</span>
                <span>2FA</span>
                <span>Last seen</span>
                <span>Actions</span>
              </div>
              <div v-for="u in users" :key="u.id" class="dev-user-row">
                <span class="dev-user-id">#{{ u.id }}</span>
                <span class="dev-user-name">{{ u.username }}</span>
                <span :class="u.role === 'gm' ? 'tag-yes' : 'tag-no'">{{ u.role }}</span>
                <span class="dev-user-char">{{ u.character_name || '—' }}</span>
                <span :class="u.totp_enabled ? 'tag-yes' : 'tag-no'">{{ u.totp_enabled ? 'on' : 'off' }}</span>
                <span class="dev-user-seen">{{ u.last_seen ? new Date(u.last_seen).toLocaleDateString() : 'never' }}</span>
                <span class="dev-user-actions">
                  <button class="dev-btn dev-btn-xs" @click="openPasswordReset(u)">Reset PW</button>
                  <button class="dev-btn dev-btn-xs dev-btn-danger" @click="confirmDeleteUser(u)">Remove</button>
                </span>
              </div>
            </div>

            <!-- Password reset inline form -->
            <div v-if="pwReset.userId" class="dev-pw-form">
              <div class="dev-pw-form-title">Reset password for <strong>{{ pwReset.username }}</strong></div>
              <div class="dev-pw-row">
                <input
                  v-model="pwReset.password"
                  type="password"
                  class="dev-input"
                  placeholder="New password (min 6 chars)"
                  @keyup.enter="submitPasswordReset"
                />
                <button class="dev-btn dev-btn-primary dev-btn-sm" @click="submitPasswordReset" :disabled="pwReset.busy">
                  {{ pwReset.busy ? 'Saving…' : 'Set Password' }}
                </button>
                <button class="dev-btn dev-btn-ghost dev-btn-sm" @click="pwReset.userId = null">Cancel</button>
              </div>
              <div v-if="pwReset.error" class="dev-error-msg">{{ pwReset.error }}</div>
              <div v-if="pwReset.success" class="dev-saved-badge">✓ Password updated — sessions invalidated</div>
            </div>

            <!-- Delete confirmation -->
            <div v-if="deleteConfirm.userId" class="dev-confirm-overlay">
              <div class="dev-confirm-box">
                <div class="dev-confirm-title">Remove user <strong>{{ deleteConfirm.username }}</strong>?</div>
                <div class="dev-confirm-desc">This permanently deletes the account and all associated data. Cannot be undone.</div>
                <div class="dev-confirm-actions">
                  <button class="dev-btn dev-btn-danger" @click="submitDeleteUser" :disabled="deleteConfirm.busy">
                    {{ deleteConfirm.busy ? 'Removing…' : 'Yes, remove' }}
                  </button>
                  <button class="dev-btn dev-btn-ghost" @click="deleteConfirm.userId = null">Cancel</button>
                </div>
                <div v-if="deleteConfirm.error" class="dev-error-msg">{{ deleteConfirm.error }}</div>
              </div>
            </div>
          </section>

          <!-- ── Route Audit ── -->
          <section v-if="activeSec === 'routes'" class="dev-section">
            <h2 class="dev-section-title">Route Access Audit</h2>
            <p class="dev-section-desc">Confirms that <code>/dev-admin</code> is not discoverable via standard navigation. This route has no <code>meta.auth</code>, is absent from AppSidebar, and is not linked anywhere in the application UI.</p>
            <div class="dev-audit-table">
              <div class="dev-audit-row dev-audit-header">
                <span>Path</span><span>Auth Required</span><span>GM Only</span><span>Sidebar</span><span>Status</span>
              </div>
              <div v-for="r in routeAudit" :key="r.path" class="dev-audit-row" :class="{ 'audit-warn': r.warn }">
                <code>{{ r.path }}</code>
                <span :class="r.auth ? 'tag-yes' : 'tag-no'">{{ r.auth ? 'yes' : 'no' }}</span>
                <span :class="r.gm ? 'tag-yes' : 'tag-no'">{{ r.gm ? 'yes' : 'no' }}</span>
                <span :class="r.sidebar ? 'tag-yes' : 'tag-no'">{{ r.sidebar ? 'yes' : 'no' }}</span>
                <span :class="r.status === 'OK' ? 'tag-ok' : 'tag-warn'">{{ r.status }}</span>
              </div>
            </div>
          </section>

          <!-- ── Session Info ── -->
          <section v-if="activeSec === 'session'" class="dev-section">
            <h2 class="dev-section-title">Dev Session Info</h2>
            <p class="dev-section-desc">This session is stored under a separate localStorage key (<code>chronicle_dev_session</code>) and is completely isolated from the main application auth token (<code>chronicle_token</code>). Ending this session does not affect logged-in users.</p>
            <div class="dev-kv-list">
              <div class="dev-kv-row"><span class="dev-kv-key">Session key</span><code class="dev-kv-val">chronicle_dev_session</code></div>
              <div class="dev-kv-row"><span class="dev-kv-key">Session issued</span><code class="dev-kv-val">{{ sessionIssued }}</code></div>
              <div class="dev-kv-row"><span class="dev-kv-key">Isolation</span><code class="dev-kv-val">Full — no shared Pinia stores, no SSE connection</code></div>
              <div class="dev-kv-row"><span class="dev-kv-key">Route meta</span><code class="dev-kv-val">{ devOnly: true } — no meta.auth, no meta.gm</code></div>
              <div class="dev-kv-row"><span class="dev-kv-key">AppLayout</span><code class="dev-kv-val">Not used — renders outside AppLayout/AppSidebar</code></div>
              <div class="dev-kv-row"><span class="dev-kv-key">Standard app token</span><code class="dev-kv-val">{{ mainTokenPresent ? 'Present (unmodified)' : 'Not present' }}</code></div>
            </div>
            <button class="dev-btn dev-btn-danger" style="margin-top:20px" @click="clearDevSession">Clear Dev Session</button>
          </section>

        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'

// ── Auth gate — isolated from main application auth ──────────────────────────
// NOTE: Credentials are intentionally hardcoded for a local developer-only tool.
// This view is not linked from any standard navigation and is not indexed by the
// application router guard (meta.auth is absent). Do not expose this to end users.
const DEV_USER = 'system administrator'
const DEV_PASS = 'Akthos12@'
const SESSION_KEY = 'chronicle_dev_session'

const authed = ref(false)
const loginUser = ref('')
const loginPass = ref('')
const loginError = ref('')
const loginBusy = ref(false)
const sessionIssued = ref('')

function checkSession() {
  const s = localStorage.getItem(SESSION_KEY)
  if (s) {
    try {
      const parsed = JSON.parse(s)
      if (parsed.valid) {
        authed.value = true
        sessionIssued.value = parsed.issued || '—'
        return
      }
    } catch { /* invalid */ }
  }
  authed.value = false
}

async function attemptLogin() {
  loginError.value = ''
  loginBusy.value = true
  // Simulate a brief auth delay for UX
  await new Promise(r => setTimeout(r, 420))
  if (loginUser.value === DEV_USER && loginPass.value === DEV_PASS) {
    const issued = new Date().toISOString()
    localStorage.setItem(SESSION_KEY, JSON.stringify({ valid: true, issued }))
    sessionIssued.value = issued
    authed.value = true
  } else {
    loginError.value = 'Invalid credentials'
  }
  loginBusy.value = false
}

function logout() {
  localStorage.removeItem(SESSION_KEY)
  authed.value = false
  loginUser.value = ''
  loginPass.value = ''
}

function clearDevSession() {
  logout()
}

const mainTokenPresent = computed(() => !!localStorage.getItem('chronicle_token'))
const buildStamp = computed(() => new Date().toISOString().slice(0, 10))

// ── Asset configurator ────────────────────────────────────────────────────────
const ASSET_STORAGE_KEY = 'chronicle_dev_assets'

const assetDefs = [
  { key: 'alien_slime_svg',    system: 'Alien',    name: 'Slime Drip SVG',         type: 'SVG string / URL', placeholder: '<svg…> or /assets/slime.svg' },
  { key: 'alien_scanline_url', system: 'Alien',    name: 'Scanline Overlay PNG',    type: 'URL',              placeholder: '/assets/scanline.png' },
  { key: 'coriolis_hud_svg',   system: 'Coriolis', name: 'Tactical HUD Schematic',  type: 'SVG string / URL', placeholder: '<svg…> or /assets/hud.svg' },
  { key: 'dune_sand_url',      system: 'Dune',     name: 'Sand Particle PNG',       type: 'URL',              placeholder: '/assets/sand-particle.png' },
  { key: 'dune_banner_svg',    system: 'Dune',     name: 'House Banner SVG',        type: 'SVG string / URL', placeholder: '<svg…> or /assets/banner.svg' },
  { key: 'coc_rune_font_url',  system: 'CoC',      name: 'Mythos Rune Font URL',    type: 'URL',              placeholder: 'https://…/rune-font.woff2' },
  { key: 'achtung_knife_svg',  system: 'Achtung!', name: 'Fairbairn-Sykes Knife SVG', type: 'SVG string',    placeholder: '<svg…>' },
  { key: 'achtung_manual_url', system: 'Achtung!', name: 'OSS Manual Cover PNG',    type: 'URL',              placeholder: '/assets/oss-manual.png' },
]

const assetValues = reactive({})
const savedKeys = reactive(new Set())

function loadAssets() {
  try {
    const stored = JSON.parse(localStorage.getItem(ASSET_STORAGE_KEY) || '{}')
    for (const def of assetDefs) {
      assetValues[def.key] = stored[def.key] || ''
    }
  } catch { /* ignore */ }
}

function saveAsset(key) {
  const stored = JSON.parse(localStorage.getItem(ASSET_STORAGE_KEY) || '{}')
  stored[key] = assetValues[key]
  localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(stored))
  savedKeys.add(key)
  setTimeout(() => savedKeys.delete(key), 2000)
}

function clearAsset(key) {
  assetValues[key] = ''
  saveAsset(key)
}

// ── CSS Variable live editor ──────────────────────────────────────────────────
const CSS_VAR_STORAGE_KEY = 'chronicle_dev_vars'
const varsSaved = ref(false)

const cssVarDefs = [
  { prop: '--line-height',  label: 'Baseline Line Height', type: 'text',  default: '32px' },
  { prop: '--accent',       label: 'Accent Colour',        type: 'color', default: '#c5a059' },
  { prop: '--accent2',      label: 'Accent Highlight',     type: 'color', default: '#e8c97a' },
  { prop: '--bg',           label: 'Background',           type: 'color', default: '#0f0d0a' },
  { prop: '--surface',      label: 'Surface',              type: 'color', default: '#221b12' },
  { prop: '--text',         label: 'Text',                 type: 'color', default: '#f0e8d0' },
  { prop: '--text2',        label: 'Text (secondary)',     type: 'color', default: '#b0a080' },
  { prop: '--border',       label: 'Border',               type: 'color', default: '#2a241e' },
  { prop: '--ink-color',    label: 'Ink Input Colour',     type: 'color', default: '#1A237E' },
  { prop: '--ink-blur',     label: 'Ink Blur Radius',      type: 'text',  default: '0.5px' },
  { prop: '--radius',       label: 'Border Radius',        type: 'text',  default: '4px' },
  { prop: '--font-header',  label: 'Header Font',          type: 'text',  default: "'Cinzel', Georgia, serif" },
  { prop: '--font-body',    label: 'Body Font',            type: 'text',  default: "'Crimson Pro', Georgia, serif" },
  { prop: '--anim-speed',   label: 'Animation Speed',      type: 'text',  default: '0.25s' },
]

const liveVars = reactive({})

function loadVars() {
  try {
    const stored = JSON.parse(localStorage.getItem(CSS_VAR_STORAGE_KEY) || '{}')
    for (const v of cssVarDefs) {
      const saved = stored[v.prop]
      liveVars[v.prop] = saved || ''
      if (saved) document.documentElement.style.setProperty(v.prop, saved)
    }
  } catch { /* ignore */ }
}

function setLiveVar(prop, value) {
  liveVars[prop] = value
  document.documentElement.style.setProperty(prop, value)
}

function resetVar(prop, defaultVal) {
  liveVars[prop] = ''
  document.documentElement.style.removeProperty(prop)
  const stored = JSON.parse(localStorage.getItem(CSS_VAR_STORAGE_KEY) || '{}')
  delete stored[prop]
  localStorage.setItem(CSS_VAR_STORAGE_KEY, JSON.stringify(stored))
}

function persistVars() {
  const stored = {}
  for (const v of cssVarDefs) {
    if (liveVars[v.prop]) stored[v.prop] = liveVars[v.prop]
  }
  localStorage.setItem(CSS_VAR_STORAGE_KEY, JSON.stringify(stored))
  varsSaved.value = true
  setTimeout(() => { varsSaved.value = false }, 2500)
}

function resetAllVars() {
  for (const v of cssVarDefs) {
    liveVars[v.prop] = ''
    document.documentElement.style.removeProperty(v.prop)
  }
  localStorage.removeItem(CSS_VAR_STORAGE_KEY)
}

// ── Route audit ───────────────────────────────────────────────────────────────
const routeAudit = [
  { path: '/home',           auth: true,  gm: false, sidebar: true,  status: 'OK',   warn: false },
  { path: '/dashboard',      auth: true,  gm: false, sidebar: true,  status: 'OK',   warn: false },
  { path: '/gm-dashboard',   auth: true,  gm: true,  sidebar: true,  status: 'OK',   warn: false },
  { path: '/combat',         auth: true,  gm: true,  sidebar: true,  status: 'OK',   warn: false },
  { path: '/settings',       auth: true,  gm: false, sidebar: true,  status: 'OK',   warn: false },
  { path: '/login',          auth: false, gm: false, sidebar: false, status: 'OK',   warn: false },
  { path: '/dev-admin',      auth: false, gm: false, sidebar: false, status: 'HIDDEN — Dev Only', warn: false },
]

// ── Section nav ───────────────────────────────────────────────────────────────
const sections = [
  { id: 'assets',  label: 'Immersion Assets', icon: '🖼' },
  { id: 'vars',    label: 'CSS Variables',    icon: '🎨' },
  { id: 'db',      label: 'Database',         icon: '🗄' },
  { id: 'users',   label: 'User Management',  icon: '👤' },
  { id: 'routes',  label: 'Route Audit',      icon: '🔒' },
  { id: 'session', label: 'Session Info',     icon: '🔑' },
]

// ── Database inspector ────────────────────────────────────────────────────────
const dbQuery  = ref('SELECT id, username, role, created_at FROM users ORDER BY id;')
const dbResult = ref(null)
const dbLoading = ref(false)
const dbError  = ref('')

const quickQueries = [
  { label: 'Users',      sql: 'SELECT id, username, role, character_name, last_seen, created_at FROM users ORDER BY id;' },
  { label: 'Campaigns',  sql: 'SELECT id, name, system, active, created_at FROM campaigns ORDER BY id;' },
  { label: 'Characters', sql: 'SELECT id, user_id, name, class, level, created_at FROM characters ORDER BY id;' },
  { label: 'Audit log',  sql: 'SELECT al.id, u.username, al.action, al.target_type, al.detail, al.ip, al.created_at FROM audit_log al LEFT JOIN users u ON u.id = al.user_id ORDER BY al.id DESC LIMIT 50;' },
  { label: 'Tables',     sql: "SELECT name, type FROM sqlite_master WHERE type IN ('table','view') ORDER BY name;" },
  { label: 'Schema',     sql: "SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name;" },
]

function runQuick(sql) {
  dbQuery.value = sql
  runQuery()
}

async function runQuery() {
  if (!dbQuery.value.trim()) return
  dbLoading.value = true
  dbError.value = ''
  dbResult.value = null
  try {
    const d = await devFetch('/api/dev-admin/query', { method: 'POST', body: { sql: dbQuery.value } })
    dbResult.value = d
  } catch (e) {
    dbError.value = e.message
  } finally {
    dbLoading.value = false
  }
}
const activeSec = ref('assets')

// ── User management ───────────────────────────────────────────────────────────
const DEV_API_KEY = 'dev-chronicle-admin-Akthos12'
const users = ref([])
const usersLoading = ref(false)
const usersError = ref('')

async function devFetch(path, options = {}) {
  const r = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-Dev-Key': DEV_API_KEY, ...(options.headers || {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!r.ok) {
    const d = await r.json().catch(() => ({}))
    throw new Error(d.error || `HTTP ${r.status}`)
  }
  return r.json()
}

async function loadUsers() {
  usersLoading.value = true
  usersError.value = ''
  try {
    const d = await devFetch('/api/dev-admin/users')
    users.value = d.users
  } catch (e) {
    usersError.value = e.message
  } finally {
    usersLoading.value = false
  }
}

// Password reset
const pwReset = reactive({ userId: null, username: '', password: '', busy: false, error: '', success: false })

function openPasswordReset(u) {
  Object.assign(pwReset, { userId: u.id, username: u.username, password: '', busy: false, error: '', success: false })
  deleteConfirm.userId = null
}

async function submitPasswordReset() {
  if (!pwReset.password || pwReset.password.length < 6) { pwReset.error = 'Password must be at least 6 characters'; return }
  pwReset.busy = true; pwReset.error = ''; pwReset.success = false
  try {
    await devFetch(`/api/dev-admin/users/${pwReset.userId}/password`, { method: 'PUT', body: { password: pwReset.password } })
    pwReset.success = true
    pwReset.password = ''
    setTimeout(() => { pwReset.userId = null }, 2000)
  } catch (e) {
    pwReset.error = e.message
  } finally {
    pwReset.busy = false
  }
}

// Delete user
const deleteConfirm = reactive({ userId: null, username: '', busy: false, error: '' })

function confirmDeleteUser(u) {
  Object.assign(deleteConfirm, { userId: u.id, username: u.username, busy: false, error: '' })
  pwReset.userId = null
}

async function submitDeleteUser() {
  deleteConfirm.busy = true; deleteConfirm.error = ''
  try {
    await devFetch(`/api/dev-admin/users/${deleteConfirm.userId}`, { method: 'DELETE' })
    users.value = users.value.filter(u => u.id !== deleteConfirm.userId)
    deleteConfirm.userId = null
  } catch (e) {
    deleteConfirm.error = e.message
    deleteConfirm.busy = false
  }
}

// Auto-load users when switching to that section
watch(activeSec, (sec) => { if (sec === 'users' && !users.value.length) loadUsers() })

onMounted(() => {
  checkSession()
  loadAssets()
  loadVars()
})
</script>

<style scoped>
/* ── Developer shell — standalone dark terminal aesthetic ──────────────── */
.dev-root {
  min-height: 100vh;
  background: #0a0c0e;
  color: #c8d0d8;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
}

/* ── Login ─────────────────────────────────────────────────────────────── */
.dev-login-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}
.dev-login-form {
  width: 100%;
  max-width: 360px;
  background: #0f1318;
  border: 1px solid #1e2830;
  border-top: 2px solid #2a4060;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dev-login-header {
  text-align: center;
  margin-bottom: 14px;
}
.dev-login-icon { font-size: 28px; opacity: 0.6; display: block; margin-bottom: 8px; }
.dev-login-title { font-size: 12px; letter-spacing: 0.22em; color: #4a7aaa; }
.dev-login-sub   { font-size: 10px; color: #3a5060; letter-spacing: 0.12em; margin-top: 4px; }
.dev-login-error { color: #c94c4c; font-size: 11px; padding: 4px 0; }
.dev-field-label { font-size: 10px; letter-spacing: 0.14em; color: #3a6080; }

/* ── Shell header ──────────────────────────────────────────────────────── */
.dev-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: #0c1016;
  border-bottom: 1px solid #1a2530;
}
.dev-header-icon  { font-size: 16px; opacity: 0.5; }
.dev-header-title { font-size: 11px; letter-spacing: 0.2em; color: #4a7aaa; flex: 1; }
.dev-header-build { font-size: 10px; color: #2a4050; }
.dev-logout { margin-left: auto; font-size: 11px; }

/* ── Body layout ───────────────────────────────────────────────────────── */
.dev-body {
  display: flex;
  height: calc(100vh - 42px);
}

/* ── Sidenav ───────────────────────────────────────────────────────────── */
.dev-sidenav {
  width: 180px;
  flex-shrink: 0;
  background: #0c1016;
  border-right: 1px solid #1a2530;
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  gap: 2px;
}
.dev-sidenav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: none;
  border: none;
  color: #3a5870;
  font-family: inherit;
  font-size: 11px;
  letter-spacing: 0.08em;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s, color 0.12s;
}
.dev-sidenav-item:hover  { background: rgba(74,122,170,0.06); color: #5a90c0; }
.dev-sidenav-item.active { background: rgba(74,122,170,0.12); color: #6aaad0; border-left: 2px solid #4a7aaa; }
.dev-sidenav-icon { font-size: 13px; }

/* ── Panel ─────────────────────────────────────────────────────────────── */
.dev-panel {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
}
.dev-section-title {
  font-size: 13px;
  letter-spacing: 0.16em;
  color: #4a7aaa;
  margin-bottom: 8px;
}
.dev-section-desc {
  font-size: 11px;
  color: #3a5060;
  line-height: 1.6;
  margin-bottom: 20px;
  max-width: 640px;
}
.dev-section-desc code { color: #5a8aaa; background: rgba(74,122,170,0.08); padding: 1px 4px; }

/* ── Asset blocks ──────────────────────────────────────────────────────── */
.dev-asset-block {
  background: #0f1318;
  border: 1px solid #1a2530;
  border-left: 2px solid #2a4060;
  padding: 12px 16px;
  margin-bottom: 12px;
}
.dev-asset-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.dev-asset-system { font-size: 9px; letter-spacing: 0.15em; color: #3a6080; background: rgba(74,122,170,0.1); padding: 2px 6px; }
.dev-asset-name   { font-size: 11px; color: #8aa8c0; }
.dev-asset-type   { font-size: 9px; color: #2a4050; margin-left: auto; }
.dev-asset-actions { display: flex; align-items: center; gap: 8px; margin-top: 8px; }

/* ── CSS vars grid ─────────────────────────────────────────────────────── */
.dev-vars-grid { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.dev-var-row {
  display: grid;
  grid-template-columns: 180px 200px 1fr 60px;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: #0f1318;
  border: 1px solid #1a2530;
}
.dev-var-label { font-size: 11px; color: #6a8aaa; }
.dev-var-prop  { font-size: 10px; color: #3a6080; }
.dev-var-controls { display: flex; align-items: center; gap: 6px; }
.dev-color-picker {
  width: 28px; height: 22px;
  border: 1px solid #2a4060;
  background: none;
  cursor: pointer;
  padding: 0;
}
.dev-var-input { flex: 1; }
.dev-vars-actions { display: flex; align-items: center; gap: 10px; }

/* ── Route audit table ─────────────────────────────────────────────────── */
.dev-audit-table { border: 1px solid #1a2530; }
.dev-audit-row {
  display: grid;
  grid-template-columns: 180px 120px 80px 80px 1fr;
  gap: 0;
  padding: 8px 12px;
  border-bottom: 1px solid #111820;
  font-size: 11px;
  align-items: center;
}
.dev-audit-row:last-child { border-bottom: none; }
.dev-audit-header { background: #0c1016; color: #3a6080; font-size: 10px; letter-spacing: 0.1em; }
.audit-warn { background: rgba(201,168,76,0.04); }
.tag-yes { color: #4c9c5c; }
.tag-no  { color: #6a4040; }
.tag-ok  { color: #4a7aaa; }
.tag-warn { color: #c9a84c; }

/* ── KV list ───────────────────────────────────────────────────────────── */
.dev-kv-list { display: flex; flex-direction: column; gap: 0; border: 1px solid #1a2530; }
.dev-kv-row  { display: flex; align-items: flex-start; gap: 16px; padding: 8px 14px; border-bottom: 1px solid #111820; font-size: 11px; }
.dev-kv-row:last-child { border-bottom: none; }
.dev-kv-key { color: #3a6080; width: 160px; flex-shrink: 0; }
.dev-kv-val { color: #6aaad0; word-break: break-all; }

/* ── Shared controls ───────────────────────────────────────────────────── */
.dev-input, .dev-textarea, .dev-var-input {
  width: 100%;
  background: #080c10;
  border: 1px solid #1a2530;
  color: #8aaac0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  padding: 7px 10px;
  outline: none;
  resize: vertical;
  transition: border-color 0.15s;
}
.dev-input:focus, .dev-textarea:focus, .dev-var-input:focus {
  border-color: #2a5080;
}
.dev-input::placeholder, .dev-textarea::placeholder {
  color: #2a4050;
}
.dev-textarea { min-height: 80px; }

.dev-btn {
  background: #0f1318;
  border: 1px solid #2a4060;
  color: #5a8aaa;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  padding: 7px 16px;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}
.dev-btn:hover { background: rgba(74,122,170,0.12); border-color: #3a6090; color: #7ab0d0; }
.dev-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.dev-btn-primary { border-color: #4a7aaa; color: #6aaad0; }
.dev-btn-primary:hover { background: rgba(74,122,170,0.2); color: #8ac0e0; }
.dev-btn-ghost { border-color: transparent; color: #3a6080; background: transparent; }
.dev-btn-ghost:hover { color: #5a8aaa; background: rgba(74,122,170,0.06); }
.dev-btn-danger { border-color: #602020; color: #c94c4c; }
.dev-btn-danger:hover { background: rgba(201,76,76,0.1); border-color: #903030; }
.dev-btn-sm { padding: 4px 10px; font-size: 10px; }
.dev-btn-xs { padding: 2px 8px; font-size: 10px; }

.dev-saved-badge {
  font-size: 10px;
  color: #4c9c5c;
  letter-spacing: 0.08em;
}

/* ── User management ───────────────────────────────────────────────────── */
.dev-users-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.dev-error-msg {
  font-size: 11px;
  color: #c94c4c;
  letter-spacing: 0.05em;
}
.dev-users-empty {
  font-size: 11px;
  color: #3a6080;
  padding: 16px 0;
}
.dev-users-table {
  border: 1px solid #1a2530;
  margin-bottom: 20px;
}
.dev-users-header {
  display: grid;
  grid-template-columns: 40px 140px 60px 140px 40px 100px 1fr;
  gap: 0;
  padding: 7px 12px;
  background: #0c1016;
  color: #3a6080;
  font-size: 10px;
  letter-spacing: 0.1em;
  border-bottom: 1px solid #1a2530;
}
.dev-user-row {
  display: grid;
  grid-template-columns: 40px 140px 60px 140px 40px 100px 1fr;
  gap: 0;
  padding: 8px 12px;
  border-bottom: 1px solid #0e1520;
  font-size: 11px;
  align-items: center;
}
.dev-user-row:last-child { border-bottom: none; }
.dev-user-row:hover { background: rgba(74,122,170,0.04); }
.dev-user-id   { color: #2a5060; }
.dev-user-name { color: #8aaac0; font-weight: 600; }
.dev-user-char { color: #4a7080; }
.dev-user-seen { color: #3a5060; }
.dev-user-actions { display: flex; gap: 6px; }

/* Password reset form */
.dev-pw-form {
  background: #0c1016;
  border: 1px solid #2a4060;
  border-left: 2px solid #4a7aaa;
  padding: 14px 16px;
  margin-bottom: 14px;
}
.dev-pw-form-title {
  font-size: 11px;
  color: #5a8aaa;
  margin-bottom: 10px;
}
.dev-pw-form-title strong { color: #8ab0d0; }
.dev-pw-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.dev-pw-row .dev-input { flex: 1; }

/* Delete confirmation */
.dev-confirm-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-bg-overlay-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.dev-confirm-box {
  background: #0f1318;
  border: 1px solid #602020;
  border-top: 2px solid #c94c4c;
  padding: 28px 32px;
  max-width: 400px;
  width: 100%;
}
.dev-confirm-title {
  font-size: 13px;
  color: #d08080;
  margin-bottom: 10px;
}
.dev-confirm-title strong { color: #e0a0a0; }
.dev-confirm-desc {
  font-size: 11px;
  color: #5a4040;
  line-height: 1.6;
  margin-bottom: 18px;
}
.dev-confirm-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

/* ── Database inspector ─────────────────────────────────────────────────── */
.dev-quick-queries {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.dev-quick-label {
  font-size: 10px;
  color: #3a6080;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.dev-db-editor {
  margin-bottom: 14px;
}
.dev-db-input {
  width: 100%;
  min-height: 80px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
  resize: vertical;
}
.dev-db-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}
.dev-db-hint {
  font-size: 10px;
  color: #2a4050;
  letter-spacing: 0.08em;
}
.dev-db-results-meta {
  font-size: 10px;
  color: #3a6080;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.dev-db-table-wrap {
  overflow-x: auto;
  border: 1px solid #1a2530;
  max-height: 420px;
  overflow-y: auto;
}
.dev-db-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
}
.dev-db-table thead {
  position: sticky;
  top: 0;
  background: #0c1016;
  z-index: 1;
}
.dev-db-table th {
  padding: 7px 12px;
  text-align: left;
  color: #3a6080;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-bottom: 1px solid #1a2530;
  white-space: nowrap;
}
.dev-db-table td {
  padding: 6px 12px;
  color: #7aaac0;
  border-bottom: 1px solid #0e1520;
  white-space: nowrap;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dev-db-table tr:hover td { background: rgba(74,122,170,0.04); }
.dev-db-table td:first-child { color: #2a5060; }
</style>
