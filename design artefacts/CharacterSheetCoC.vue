<script setup>
/**
 * DESIGN ARTEFACT: CharacterSheetCoC.vue
 * ----------------------------------------
 * Shell component — layout and styles only.
 * Wire your existing v-model bindings and autosave into the marked slots.
 *
 * PROPS (wire to your existing store/props):
 *   sheet      — the sheet_data JSONB object
 *   character  — character record (name etc.)
 *   onUpdate   — called with updated sheet_data on any change
 *
 * DESIGN TOKENS:
 *   Paper bg:    #e8dfc0  |  Header:     #c8b882
 *   Border/ink:  #8a7240  |  Dark ink:   #2a1a08
 *   Mid ink:     #4a3a18  |  Faded:      #6a5428
 *   Placeholder: #a89a6a  |  Stamp red:  #8b1a1a
 *
 * FONTS (add to index.html):
 *   <link href="https://fonts.googleapis.com/css2?family=Special+Elite
 *   &family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet"/>
 *
 * RESPONSIVE MAX-WIDTHS:
 *   default: min(720px, 90vw)
 *   1280px+: min(900px, 75vw)
 *   1600px+: min(1060px, 70vw)
 *   1920px+: min(1200px, 65vw)
 */

import { ref } from 'vue'

const props = defineProps({
  sheet: { type: Object, default: () => ({}) },
  character: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:sheet'])

const activeTab = ref(0)

const SKILLS = [
  ['Accounting','05'],['Anthropology','01'],['Appraise','05'],['Archaeology','01'],
  ['Art / Craft','05'],['Charm','15'],['Climb','20'],['Credit Rating','00'],
  ['Cthulhu Mythos','00'],['Disguise','05'],['Dodge','DEX½'],['Drive Auto','20'],
  ['Electrical Repair','10'],['Fast Talk','05'],['Fighting (Brawl)','25'],
  ['Firearms (Handgun)','20'],['Firearms (Rifle)','25'],['First Aid','30'],
  ['History','05'],['Intimidate','15'],['Jump','20'],['Language (Own)','EDU'],
  ['Law','05'],['Library Use','20'],['Listen','20'],['Locksmith','01'],
  ['Mechanical Repair','10'],['Medicine','01'],['Natural World','10'],
  ['Navigate','10'],['Occult','05'],['Operate Heavy Mach.','01'],
  ['Persuade','10'],['Pilot','01'],['Psychology','10'],['Ride','05'],
  ['Science','01'],['Sleight of Hand','10'],['Spot Hidden','25'],['Stealth','20'],
  ['Survival','10'],['Swim','20'],['Throw','20'],['Track','10'],
]

const STATS = ['STR','CON','SIZ','DEX','APP','INT','POW','EDU']

// ─── REPLACE THESE with your actual store patch method ───
function patchSheet(path, value) {
  // e.g. store.patch(path, value)
  // or emit('update:sheet', { ...props.sheet, [path]: value })
  emit('update:sheet', { field: path, value })
}
</script>

<template>
  <!-- Outer wrapper: background transparent — inherits app theme -->
  <div class="coc-page-wrap">
    <div class="a4-wrap">

      <!-- Tab bar -->
      <div class="coc-tabs">
        <button
          class="coc-tab"
          :class="{ active: activeTab === 0 }"
          @click="activeTab = 0"
        >Page I — Investigator</button>
        <button
          class="coc-tab"
          :class="{ active: activeTab === 1 }"
          @click="activeTab = 1"
        >Page II — Skills &amp; Equipment</button>
      </div>

      <div class="coc-document">

        <!-- Header -->
        <div class="coc-doc-header">
          <div class="coc-header-left">
            <router-link to="/characters" class="coc-back-link">← Characters</router-link>
            <!-- WIRE: display character name -->
            <span class="coc-char-name">{{ character.name?.toUpperCase() || 'INVESTIGATOR' }}</span>
          </div>
          <div class="coc-classified-stamp">CLASSIFIED</div>
        </div>

        <!-- ══════════════════════════════════════
             PAGE I — IDENTITY / STATS / CONDITION
             ══════════════════════════════════════ -->
        <div v-show="activeTab === 0" class="coc-page">

          <!-- Identity -->
          <div class="coc-section">
            <div class="coc-top-sec">
              <div class="coc-portrait-box">
                <img
                  v-if="sheet.portrait_url"
                  :src="sheet.portrait_url"
                  alt="Portrait"
                  class="coc-portrait-img"
                />
                <div v-else class="coc-portrait-ph">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#8a7240" stroke-width="1.5" width="22" height="22">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                  <span class="coc-portrait-lbl">SUBJECT<br>PHOTO</span>
                </div>
                <div class="coc-portrait-url-wrap">
                  <!-- WIRE: v-model="sheet.portrait_url" -->
                  <input
                    class="coc-portrait-url"
                    type="text"
                    placeholder="Portrait URL"
                    :value="sheet.portrait_url"
                    @input="patchSheet('portrait_url', $event.target.value)"
                  />
                </div>
              </div>

              <div class="coc-id-grid">
                <div class="coc-id-row full">
                  <span class="coc-fl">Investigator Name</span>
                  <!-- WIRE: :value="sheet.name" @input="patchSheet('name', ...)" -->
                  <input class="coc-fi coc-fi-large" type="text" placeholder="Full legal name..."
                    :value="sheet.name" @input="patchSheet('name', $event.target.value)"/>
                </div>
                <div class="coc-id-row">
                  <span class="coc-fl">Occupation</span>
                  <input class="coc-fi" type="text" placeholder="e.g. Journalist..."
                    :value="sheet.occupation" @input="patchSheet('occupation', $event.target.value)"/>
                </div>
                <div class="coc-id-row">
                  <span class="coc-fl">Age / Birthdate</span>
                  <input class="coc-fi" type="text" placeholder="e.g. 34, Oct 1893"
                    :value="sheet.age" @input="patchSheet('age', $event.target.value)"/>
                </div>
                <div class="coc-id-row">
                  <span class="coc-fl">Nationality</span>
                  <input class="coc-fi" type="text" placeholder="e.g. American, Boston"
                    :value="sheet.nationality" @input="patchSheet('nationality', $event.target.value)"/>
                </div>
                <div class="coc-id-row">
                  <span class="coc-fl">Sex / Appearance</span>
                  <input class="coc-fi" type="text" placeholder="e.g. Male, dark hair..."
                    :value="sheet.appearance" @input="patchSheet('appearance', $event.target.value)"/>
                </div>
              </div>
            </div>
          </div>

          <!-- Background -->
          <div class="coc-section">
            <span class="coc-fl">Personal History &amp; Background</span>
            <textarea class="coc-notes-area coc-notes-bg"
              placeholder="Biographical summary, formative events, why they investigate..."
              :value="sheet.background"
              @input="patchSheet('background', $event.target.value)"
            />
          </div>

          <!-- Core Characteristics -->
          <div class="coc-section">
            <div class="coc-section-header">&#9632; Core Characteristics</div>
            <div class="coc-stats-grid">
              <div v-for="stat in STATS" :key="stat" class="coc-stat-box">
                <div class="coc-stat-name">{{ stat }}</div>
                <!-- WIRE: :value="sheet.stats?.[stat]" -->
                <input class="coc-stat-val" type="number" placeholder="—"
                  :value="sheet.stats?.[stat]"
                  @input="patchSheet(`stats.${stat}`, +$event.target.value)"/>
                <div class="coc-stat-sub">
                  <span>½</span>
                  <input type="number" :value="sheet.stats?.[`${stat}_half`]"
                    @input="patchSheet(`stats.${stat}_half`, +$event.target.value)"/>
                  <span>⅕</span>
                  <input type="number" :value="sheet.stats?.[`${stat}_fifth`]"
                    @input="patchSheet(`stats.${stat}_fifth`, +$event.target.value)"/>
                </div>
              </div>
            </div>
          </div>

          <!-- Condition -->
          <div class="coc-section">
            <div class="coc-section-header">&#9632; Condition</div>
            <div class="coc-cond-grid">
              <div v-for="pool in ['hp','sanity','magic_points']" :key="pool" class="coc-cond-box">
                <div class="coc-cond-label">{{ pool === 'hp' ? 'Hit Points' : pool === 'sanity' ? 'Sanity' : 'Magic Points' }}</div>
                <div class="coc-cond-row">
                  <div style="flex:1;text-align:center;">
                    <span class="coc-cond-span">CUR</span><br/>
                    <input class="coc-cond-input" type="number" placeholder="0"
                      :value="sheet[`${pool}_current`]"
                      @input="patchSheet(`${pool}_current`, +$event.target.value)"/>
                  </div>
                  <span class="coc-slash">/</span>
                  <div style="flex:1;text-align:center;">
                    <span class="coc-cond-span">MAX</span><br/>
                    <input class="coc-cond-input" type="number" placeholder="0"
                      :value="sheet[`${pool}_max`]"
                      @input="patchSheet(`${pool}_max`, +$event.target.value)"/>
                  </div>
                </div>
              </div>
              <div class="coc-cond-box">
                <div class="coc-cond-label">Luck</div>
                <input class="coc-cond-input coc-cond-full" type="number" placeholder="0"
                  :value="sheet.luck" @input="patchSheet('luck', +$event.target.value)"/>
              </div>
              <div class="coc-cond-box">
                <div class="coc-cond-label">Move Rate</div>
                <input class="coc-cond-input coc-cond-full" type="number" placeholder="8"
                  :value="sheet.move_rate" @input="patchSheet('move_rate', +$event.target.value)"/>
              </div>
              <div class="coc-cond-box">
                <div class="coc-cond-label">Build / DB</div>
                <input class="coc-cond-input coc-cond-full" type="text" placeholder="+0"
                  :value="sheet.build" @input="patchSheet('build', $event.target.value)"/>
              </div>
            </div>
          </div>

          <!-- Allies & Phobias -->
          <div class="coc-section">
            <div class="coc-two-col">
              <div class="coc-notes-col">
                <div class="coc-section-header">&#9632; Allies &amp; Contacts</div>
                <textarea class="coc-notes-area"
                  placeholder="Names, relationships, loyalties..."
                  :value="sheet.allies"
                  @input="patchSheet('allies', $event.target.value)"/>
              </div>
              <div class="coc-notes-col">
                <div class="coc-section-header">&#9632; Phobias &amp; Disorders</div>
                <textarea class="coc-notes-area"
                  placeholder="Phobias, manias, disorders..."
                  :value="sheet.phobias"
                  @input="patchSheet('phobias', $event.target.value)"/>
              </div>
            </div>
          </div>

        </div><!-- end page I -->

        <!-- ══════════════════════════════════
             PAGE II — SKILLS / WEAPONS / GEAR
             ══════════════════════════════════ -->
        <div v-show="activeTab === 1" class="coc-page">

          <!-- Skills -->
          <div class="coc-section">
            <div class="coc-section-header">
              &#9632; Skills
              <span class="coc-skills-hint">(tick on success)</span>
            </div>
            <div class="coc-skills-cols">
              <div v-for="[name, base] in SKILLS" :key="name" class="coc-skill-row">
                <!-- WIRE: :checked tick state from sheet.skill_ticks[name] -->
                <div class="coc-skill-chk"
                  :class="{ checked: sheet.skill_ticks?.[name] }"
                  @click="patchSheet(`skill_ticks.${name}`, !sheet.skill_ticks?.[name])"
                />
                <span class="coc-skill-name">{{ name }}</span>
                <span class="coc-skill-base">({{ base }})</span>
                <input class="coc-skill-val" type="number" min="1" max="99"
                  :value="sheet.skills?.[name]"
                  @input="patchSheet(`skills.${name}`, +$event.target.value)"/>
              </div>
            </div>
          </div>

          <!-- Weapons -->
          <div class="coc-section">
            <div class="coc-section-header">&#9632; Weapons</div>
            <div class="coc-weap-header">
              <span class="coc-fl">Weapon</span>
              <span class="coc-fl">Damage</span>
              <span class="coc-fl">Range</span>
              <span class="coc-fl">Skill %</span>
            </div>
            <!-- WIRE: v-for="(w, i) in sheet.weapons" -->
            <div v-for="i in 5" :key="i" class="coc-weap-row">
              <input class="coc-ii" type="text" placeholder="e.g. .38 Revolver"
                :value="sheet.weapons?.[i-1]?.name"
                @input="patchSheet(`weapons.${i-1}.name`, $event.target.value)"/>
              <input class="coc-ii" type="text" placeholder="1D10"
                :value="sheet.weapons?.[i-1]?.damage"
                @input="patchSheet(`weapons.${i-1}.damage`, $event.target.value)"/>
              <input class="coc-ii" type="text" placeholder="15 yds"
                :value="sheet.weapons?.[i-1]?.range"
                @input="patchSheet(`weapons.${i-1}.range`, $event.target.value)"/>
              <input class="coc-ii" type="number" placeholder="20"
                :value="sheet.weapons?.[i-1]?.skill_pct"
                @input="patchSheet(`weapons.${i-1}.skill_pct`, +$event.target.value)"/>
            </div>
          </div>

          <!-- Gear -->
          <div class="coc-section">
            <div class="coc-section-header">&#9632; Possessions &amp; Notes</div>
            <div class="coc-gear-header">
              <span class="coc-fl">Item</span>
              <span class="coc-fl">Notes</span>
            </div>
            <div v-for="i in 5" :key="i" class="coc-gear-row">
              <input class="coc-ii" type="text" placeholder="Item..."
                :value="sheet.gear?.[i-1]?.name"
                @input="patchSheet(`gear.${i-1}.name`, $event.target.value)"/>
              <input class="coc-ii" type="text" placeholder="Notes..."
                :value="sheet.gear?.[i-1]?.notes"
                @input="patchSheet(`gear.${i-1}.notes`, $event.target.value)"/>
            </div>
            <textarea class="coc-notes-area coc-notes-session"
              placeholder="Session notes, clues, tomes, mythos lore..."
              :value="sheet.session_notes"
              @input="patchSheet('session_notes', $event.target.value)"/>
          </div>

        </div><!-- end page II -->

        <!-- Footer -->
        <div class="coc-doc-footer">
          <span>Keep secure — destroy if compromised</span>
          <span>Page {{ activeTab === 0 ? 'I' : 'II' }} of II</span>
          <span class="coc-lua-stamp">For authorised eyes only</span>
        </div>

      </div><!-- .coc-document -->
    </div><!-- .a4-wrap -->
  </div><!-- .coc-page-wrap -->
</template>

<style scoped>
/* Google Fonts: add to index.html, NOT here */

.coc-page-wrap {
  min-height: 100vh;
  padding: 32px 24px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: transparent;
}

.a4-wrap {
  width: min(720px, 90vw);
  transform: rotate(-0.6deg);
  transform-origin: center top;
  box-shadow:
    0 2px 4px rgba(0,0,0,.15),
    3px 3px 0 rgba(0,0,0,.2),
    6px 6px 0 rgba(0,0,0,.15),
    8px 12px 28px rgba(0,0,0,.55),
    -2px -1px 8px rgba(0,0,0,.2);
  position: relative;
}

.a4-wrap::after {
  content: '';
  position: absolute;
  bottom: 0; right: 0;
  width: 28px; height: 28px;
  background: linear-gradient(225deg, #b8a87a 45%, rgba(140,110,60,.4) 100%);
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
  z-index: 10;
}

.coc-tabs { display: flex; padding: 0 0 0 2px; }

.coc-tab {
  font-family: 'Courier Prime', monospace;
  font-size: 12px; font-weight: 700;
  letter-spacing: 2px; text-transform: uppercase;
  padding: 6px 18px;
  background: #c8b882;
  border: 1px solid #8a7240; border-bottom: none;
  cursor: pointer; color: #4a3a18;
  transition: background .15s;
}
.coc-tab.active {
  background: #e8dfc0; color: #2a1a08;
  border-bottom: 1px solid #e8dfc0;
  position: relative; z-index: 2;
}
.coc-tab:hover:not(.active) { background: #d4c496; }

.coc-document {
  background: #e8dfc0;
  border: 1px solid #8a7240;
  position: relative;
  display: flex; flex-direction: column;
}
.coc-document::before {
  content: '';
  position: absolute; inset: 0;
  background: repeating-linear-gradient(0deg,
    transparent, transparent 27px,
    rgba(120,100,60,.07) 27px, rgba(120,100,60,.07) 28px);
  pointer-events: none; z-index: 0;
}

.coc-doc-header {
  background: #c8b882; border-bottom: 2px solid #8a7240;
  padding: 10px 18px; display: flex;
  justify-content: space-between; align-items: center;
  position: relative; z-index: 1; flex-wrap: wrap; gap: 8px;
}
.coc-header-left { display: flex; align-items: center; gap: 10px; }
.coc-back-link { font-family: 'Courier Prime', monospace; font-size: 10px; color: #6a5428; text-decoration: none; }
.coc-char-name { font-family: 'Courier Prime', monospace; font-size: 16px; font-weight: 700; color: #2a1a08; letter-spacing: 2px; }
.coc-classified-stamp {
  font-family: 'Special Elite', cursive; color: #8b1a1a;
  font-size: 18px; letter-spacing: 4px;
  border: 3px double #8b1a1a; padding: 3px 10px;
  transform: rotate(-2deg); display: inline-block; opacity: .85;
}

.coc-page { padding: 16px 18px; position: relative; z-index: 1; display: flex; flex-direction: column; gap: 11px; }
.coc-section { padding-bottom: 11px; border-bottom: 1px solid #b0a070; }
.coc-section:last-child { border-bottom: none; padding-bottom: 0; }
.coc-section-header {
  font-family: 'Courier Prime', monospace; font-size: 9px; font-weight: 700;
  letter-spacing: 3px; text-transform: uppercase; color: #4a3a18;
  background: #c8b882; padding: 2px 8px; margin-bottom: 7px;
  border-left: 3px solid #8a7240;
}
.coc-skills-hint { font-size: 8px; font-weight: 400; letter-spacing: 0; margin-left: 6px; }

.coc-fl { font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: #6a5428; font-family: 'Courier Prime', monospace; }
.coc-fi {
  background: transparent; border: none; border-bottom: 1px solid #8a7240;
  font-family: 'Courier Prime', monospace; font-size: 12px; color: #2a1a08;
  width: 100%; padding: 1px 0; outline: none;
}
.coc-fi-large { font-size: 14px; font-weight: 700; }
.coc-fi::placeholder { color: #a89a6a; font-style: italic; }
.coc-fi:focus { border-bottom-color: #4a3a18; background: rgba(180,160,100,.2); }

.coc-top-sec { display: grid; grid-template-columns: 100px 1fr; gap: 12px; }
.coc-portrait-box {
  border: 1.5px solid #8a7240; background: #d4c9a8;
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; height: 100px;
  position: relative; overflow: hidden;
}
.coc-portrait-img { width: 100%; height: 100%; object-fit: cover; }
.coc-portrait-ph { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.coc-portrait-lbl { font-size: 7px; color: #6a5428; letter-spacing: 1px; text-align: center; font-family: 'Courier Prime', monospace; }
.coc-portrait-url-wrap { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(180,160,100,.9); padding: 2px; }
.coc-portrait-url { width: 100%; font-size: 7px; background: transparent; border: none; border-bottom: 1px solid #8a7240; color: #4a3a18; text-align: center; outline: none; font-family: 'Courier Prime', monospace; }

.coc-id-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px; }
.coc-id-row { display: flex; flex-direction: column; gap: 1px; }
.coc-id-row.full { grid-column: 1 / -1; }

.coc-stats-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; }
.coc-stat-box { border: 1px solid #8a7240; background: rgba(180,160,100,.2); padding: 3px 4px; text-align: center; }
.coc-stat-name { font-size: 7px; letter-spacing: 1px; color: #6a5428; font-family: 'Courier Prime', monospace; font-weight: 700; text-transform: uppercase; }
.coc-stat-val { font-size: 15px; font-weight: 700; color: #2a1a08; width: 100%; background: transparent; border: none; text-align: center; font-family: 'Courier Prime', monospace; outline: none; }
.coc-stat-val:focus { background: rgba(180,160,100,.3); }
.coc-stat-sub { font-size: 7px; color: #8a7240; display: flex; justify-content: space-between; margin-top: 1px; }
.coc-stat-sub input { width: 16px; background: transparent; border: none; border-bottom: 1px solid #8a7240; font-size: 7px; color: #4a3a18; text-align: center; outline: none; font-family: 'Courier Prime', monospace; }

.coc-cond-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 5px; }
.coc-cond-box { border: 1px solid #8a7240; padding: 4px 6px; background: rgba(180,160,100,.15); }
.coc-cond-label { font-size: 7px; letter-spacing: 1px; color: #6a5428; font-family: 'Courier Prime', monospace; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
.coc-cond-row { display: flex; gap: 3px; align-items: center; }
.coc-cond-span { font-size: 7px; color: #8a7240; }
.coc-slash { font-size: 7px; color: #8a7240; }
.coc-cond-input { background: transparent; border: none; border-bottom: 1px solid #8a7240; font-size: 13px; font-weight: 700; color: #2a1a08; text-align: center; font-family: 'Courier Prime', monospace; outline: none; min-width: 0; flex: 1; }
.coc-cond-full { width: 100%; }

.coc-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.coc-notes-col { display: flex; flex-direction: column; gap: 5px; }
.coc-notes-area { width: 100%; background: rgba(180,160,100,.1); border: 1px solid #b0a070; font-family: 'Courier Prime', monospace; font-size: 10px; color: #2a1a08; padding: 5px; resize: none; outline: none; min-height: 55px; line-height: 1.6; }
.coc-notes-bg { min-height: 38px; }
.coc-notes-session { margin-top: 6px; }

.coc-skills-cols { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0 14px; }
.coc-skill-row { display: flex; align-items: center; gap: 3px; padding: 1px 0; border-bottom: 1px dotted #c0b080; font-size: 9px; color: #2a1a08; }
.coc-skill-chk { width: 9px; height: 9px; border: 1px solid #8a7240; background: transparent; flex-shrink: 0; cursor: pointer; }
.coc-skill-chk.checked { background: #8b1a1a; }
.coc-skill-name { flex: 1; font-family: 'Courier Prime', monospace; font-size: 9px; }
.coc-skill-base { font-size: 7px; color: #8a7240; white-space: nowrap; }
.coc-skill-val { width: 24px; background: transparent; border: none; border-bottom: 1px solid #8a7240; text-align: center; font-family: 'Courier Prime', monospace; font-size: 11px; font-weight: 700; color: #2a1a08; outline: none; }

.coc-weap-header, .coc-weap-row { display: grid; grid-template-columns: 2fr 1fr 1fr 55px; gap: 4px; }
.coc-weap-header { margin-bottom: 2px; }
.coc-weap-row { border-bottom: 1px dotted #c0b080; padding: 2px 0; }
.coc-gear-header, .coc-gear-row { display: grid; grid-template-columns: 2fr 1fr; gap: 6px; }
.coc-gear-header { margin-bottom: 2px; }
.coc-gear-row { border-bottom: 1px dotted #c0b080; padding: 2px 0; }
.coc-ii { background: transparent; border: none; border-bottom: 1px solid #b0a070; font-family: 'Courier Prime', monospace; font-size: 10px; color: #2a1a08; width: 100%; outline: none; }
.coc-ii::placeholder { color: #b0a070; font-style: italic; }

.coc-doc-footer {
  background: #c8b882; border-top: 2px solid #8a7240;
  padding: 4px 18px; display: flex; justify-content: space-between;
  align-items: center; font-size: 8px; color: #6a5428;
  font-family: 'Courier Prime', monospace; letter-spacing: 1px;
  flex-wrap: wrap; gap: 4px; position: relative; z-index: 1;
}
.coc-lua-stamp { border: 1px solid #8b1a1a; color: #8b1a1a; padding: 2px 5px; letter-spacing: 2px; opacity: .7; transform: rotate(1deg); display: inline-block; }

input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }

/* Responsive */
@media (min-width: 1280px) { .a4-wrap { width: min(900px, 75vw); } }
@media (min-width: 1600px) { .a4-wrap { width: min(1060px, 70vw); } }
@media (min-width: 1920px) { .a4-wrap { width: min(1200px, 65vw); } }
@media (max-width: 900px) {
  .coc-stats-grid { grid-template-columns: repeat(4, 1fr); }
  .coc-cond-grid { grid-template-columns: repeat(3, 1fr); }
  .coc-skills-cols { grid-template-columns: 1fr 1fr; }
  .coc-page-wrap { padding: 20px 12px 36px; }
  .a4-wrap { transform: rotate(-0.4deg); }
}
@media (max-width: 600px) {
  .coc-stats-grid { grid-template-columns: repeat(2, 1fr); }
  .coc-cond-grid { grid-template-columns: 1fr 1fr; }
  .coc-skills-cols { grid-template-columns: 1fr; }
  .coc-top-sec { grid-template-columns: 80px 1fr; }
  .coc-two-col { grid-template-columns: 1fr; }
  .coc-id-grid { grid-template-columns: 1fr; }
  .coc-tab { font-size: 9px; padding: 4px 8px; }
  .coc-page-wrap { padding: 12px 8px 24px; }
  .a4-wrap { transform: rotate(-0.2deg); }
}
</style>
