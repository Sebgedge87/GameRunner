<template>
  <div class="page-content" :class="{ 'dossier-mode': dossierMode, 'coc-mode': cocMode, 'alien-mode': alienMode }">

    <!-- GM: player selector (only when not viewing a specific character by id) -->
    <div v-if="campaign.isGm && !characterId" class="gm-only" style="margin-bottom:16px;max-width:280px">
      <div class="field-group">
        <label>View Player</label>
        <select v-model="selectedUserId" @change="loadSheet">
          <option value="">— Select Player —</option>
          <option v-for="u in data.users.filter(u => u.role !== 'gm')" :key="u.id" :value="u.id">{{ u.username }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading sheet...</div>

    <!-- No sheet yet -->
    <div v-else-if="!sheet" class="empty-state">
      <template v-if="campaign.isGm && !selectedUserId">
        <div style="opacity:0.5">Select a player above to view their sheet.</div>
      </template>
      <template v-else>
        <div>No character sheet yet.</div>
        <button class="btn" style="margin-top:12px" @click="startEdit">
          {{ campaign.isGm ? 'Create Sheet for Player' : 'Create My Sheet' }}
        </button>
      </template>
    </div>

    <!-- ── VIEW MODE (always editable) ──────────────────────────────────── -->
    <template v-else>

      <!-- D&D Beyond banner (5e with URL set) -->
      <div v-if="hasDndBeyond && sheet.dnd_beyond_url" class="beyond-banner">
        <div class="beyond-banner-info">
          <div class="beyond-banner-name">{{ sheet.name || auth.currentUser?.username }}</div>
          <div class="beyond-banner-sub">D&amp;D Beyond character sheet</div>
        </div>
        <a :href="sheet.dnd_beyond_url" target="_blank" rel="noopener" class="btn beyond-btn">Open in D&amp;D Beyond ↗</a>
      </div>

      <!-- 5e: nudge to add Beyond URL if missing -->
      <div v-else-if="hasDndBeyond && !sheet.dnd_beyond_url" class="beyond-placeholder">
        <div style="opacity:.6;font-size:.9em">No D&amp;D Beyond link set.</div>
        <button v-if="!campaign.isGm" class="btn btn-sm" style="margin-top:8px" @click="startEdit">Add D&amp;D Beyond URL</button>
      </div>

      <!-- Built-in sheet for other systems -->
      <template v-if="hasBuiltinSheet">

        <div class="a4-wrap">

        <!-- Tabs above document box -->
        <div class="doc-tabs-bar">
          <div class="doc-tabs">
            <button v-for="(p, i) in pages" :key="p.id"
              class="doc-tab"
              :class="{ active: activePage === p.id }"
              @click="goToPage(i)">
              {{ p.label }}
            </button>
          </div>
          <div class="doc-tabs-right">
            <button class="doc-nav-btn" :disabled="pageIndex === 0" @click="prevPage" aria-label="Previous page">&#8249;</button>
            <button class="doc-nav-btn" :disabled="pageIndex === pages.length - 1" @click="nextPage" aria-label="Next page">&#8250;</button>
            <span class="sheet-save-indicator" :class="saveStatus">
              <span v-if="saveStatus === 'saving'">Saving…</span>
              <span v-else-if="saveStatus === 'saved'">Saved ✓</span>
              <span v-else-if="saveStatus === 'error'" :title="saveError">Error ✗</span>
            </span>
          </div>
        </div>

        <!-- Document box — paper surface with offset shadow -->
        <div class="document-box">

          <!-- Box header: title left, CLASSIFIED stamp right -->
          <div class="doc-box-header">
            <div class="doc-box-title">
              <a v-if="characterId" class="back-link" @click="router.push('/characters')">← Characters</a>
              <div class="page-title">{{ sheet?.name || 'Character' }}</div>
            </div>
            <div class="classified-stamp" aria-hidden="true">{{ alienMode ? 'RESTRICTED' : 'Classified' }}</div>
          </div>

        <!-- Page flip container -->
        <div class="sheet-page-wrap">
        <Transition :name="flipTransition">
        <div class="sheet-page" :key="activePage">

        <!-- ── IDENTITY ──────────────────────────────────── -->
        <template v-if="activePage === 'identity'">

        <!-- CoC investigator stamp -->
        <div v-if="cocMode" class="coc-stamp-wrap" aria-hidden="true">
          <div class="coc-stamp-circle">
            <span class="coc-stamp-text">Investigator<br/>File</span>
          </div>
        </div>

        <!-- Portrait URL field + inline preview -->
        <div class="field-group" style="margin-bottom:12px">
          <label>Portrait URL <span style="opacity:.5;font-weight:400">(optional)</span></label>
          <div style="display:flex;gap:10px;align-items:center">
            <img v-if="ef.portrait_url" :src="ef.portrait_url" alt="Portrait"
                 style="width:48px;height:48px;object-fit:cover;border-radius:4px;border:1px solid var(--border);flex-shrink:0" />
            <input v-model="ef.portrait_url" class="form-input" placeholder="https://…" />
          </div>
        </div>

        <!-- D&D Beyond URL (5e only) -->
        <template v-if="hasDndBeyond">
          <div class="field-group" style="margin-bottom:16px">
            <label>D&amp;D Beyond Character URL</label>
            <input v-model="ef.dnd_beyond_url" class="form-input" placeholder="https://www.dndbeyond.com/characters/…" />
            <div style="font-size:0.78em;opacity:0.5;margin-top:4px">Paste the URL from your D&amp;D Beyond character page. Players and GMs can open it directly from here.</div>
          </div>
        </template>

        <!-- Basic identity grid -->
        <template v-if="hasBuiltinSheet">
          <div class="edit-grid">
            <div class="field-group">
              <label>Character Name</label>
              <input v-model="ef.name" class="form-input" />
            </div>
            <div class="field-group">
              <label>{{ activeSys === 'achtung' ? 'Archetype' : activeSys === 'alien' ? 'Career' : 'Class / Role' }}</label>
              <input v-model="ef.class" class="form-input" :placeholder="activeSys === 'alien' ? 'e.g. Warrant Officer, Colonial Marine…' : 'e.g. Investigator, Marine…'" />
            </div>
            <div class="field-group">
              <label>{{ activeSys === 'achtung' ? 'Nationality' : 'Race / Species' }}</label>
              <input v-model="ef.race" class="form-input" placeholder="e.g. Human, Android…" />
            </div>
            <div class="field-group">
              <label>{{ activeSys === 'achtung' ? 'Rank' : 'Level / Rank' }}</label>
              <input v-model.number="ef.level" type="number" class="form-input" min="1" />
            </div>
            <div class="field-group">
              <label>{{ activeSys === 'achtung' ? 'Background' : 'Background / Occupation' }}</label>
              <input v-model="ef.background" class="form-input" />
            </div>
            <div class="field-group">
              <label>Concept</label>
              <input v-model="ef.concept" class="form-input" placeholder="One-line character concept…" />
            </div>
            <!-- System-specific identity fields (excluding section/boolean/textarea/consumable/relationship keys) -->
            <template v-for="f in extraFields.filter(f => !f.section && !f.type === 'boolean' && !f.type === 'textarea' && !['buddy_1','buddy_2','buddy_3','buddy_4','major_wound','temp_insanity','indef_insanity','unconscious','dying','gear','equipment_note','cons_air','cons_food','cons_water','cons_power','tiny_items'].includes(f.key))" :key="f.key">
              <div class="field-group">
                <label>{{ f.label }}<span v-if="f.help" class="field-help" :data-tooltip="f.help">?</span></label>
                <select v-if="f.type === 'select'" v-model="ef[f.key]" class="form-input">
                  <option value="">— choose —</option>
                  <option v-for="o in f.options" :key="o" :value="o">{{ o }}</option>
                </select>
                <input v-else-if="f.type === 'number'" v-model.number="ef[f.key]" type="number" class="form-input" />
                <input v-else v-model="ef[f.key]" class="form-input" />
              </div>
            </template>
          </div>

          <!-- Relationships (Coriolis buddy slots) -->
          <template v-if="activeSys === 'coriolis'">
            <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em">Relationships</div>
            <div class="edit-grid">
              <div v-for="n in [1,2,3,4]" :key="n" class="field-group">
                <label>PC {{ n }}<span class="field-help" data-tooltip="Name of a crew member you have a bond or history with.">?</span></label>
                <input v-model="ef['buddy_' + n]" class="form-input" placeholder="Name…" />
              </div>
            </div>
          </template>

          <!-- Core stats (system-specific) -->
          <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em">Core Stats</div>
          <div class="edit-stats-grid">
            <div v-for="stat in coreStats" :key="stat.key" class="field-group">
              <label>{{ stat.label }}<span v-if="stat.help" class="field-help" :data-tooltip="stat.help">?</span></label>
              <input v-model.number="ef[stat.key]" type="number" class="form-input" placeholder="0" />
            </div>
          </div>

          <!-- HP / Condition -->
          <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em">Condition</div>
          <div class="edit-grid">
            <div class="field-group">
              <label>HP (Current)<span class="field-help" :data-tooltip="conditionHelp.hp">?</span></label>
              <input v-model.number="ef.hp_current" type="number" class="form-input" />
            </div>
            <div class="field-group">
              <label>HP (Max)<span class="field-help" :data-tooltip="conditionHelp.hp">?</span><span v-if="activeSys === 'coriolis' && ef.strength && ef.agility" class="derive-hint" @click="ef.hp_max = (ef.strength||0)+(ef.agility||0)">← STR+AGL ({{ (ef.strength||0)+(ef.agility||0) }})</span></label>
              <input v-model.number="ef.hp_max" type="number" class="form-input" />
            </div>
            <div v-if="hasStress" class="field-group">
              <label>{{ activeSys === 'alien' ? 'Stress' : 'Stress (Current)' }}<span class="field-help" :data-tooltip="conditionHelp.stress">?</span></label>
              <input v-model.number="ef.stress_current" type="number" class="form-input" :max="activeSys === 'alien' ? 10 : undefined" />
            </div>
            <div v-if="hasStress" class="field-group">
              <label>
                {{ activeSys === 'alien' ? 'Panic Threshold' : 'Stress (Max)' }}<span class="field-help" :data-tooltip="conditionHelp.stress">?</span><span v-if="activeSys === 'alien' && ef.empathy" class="derive-hint" @click="ef.stress_panic = ef.empathy">← EMP ({{ ef.empathy }})</span>
              </label>
              <input v-if="activeSys === 'alien'" v-model.number="ef.stress_panic" type="number" class="form-input" min="1" max="12" />
              <input v-else v-model.number="ef.stress_max" type="number" class="form-input" />
            </div>
            <div v-if="hasMagicPoints" class="field-group">
              <label>Magic Points (Current)<span class="field-help" :data-tooltip="conditionHelp.mp">?</span></label>
              <input v-model.number="ef.mp_current" type="number" class="form-input" />
            </div>
            <div v-if="hasMagicPoints" class="field-group">
              <label>Magic Points (Max)<span class="field-help" :data-tooltip="conditionHelp.mp">?</span><span v-if="activeSys === 'coc' && ef.pow" class="derive-hint" @click="ef.mp_max = ef.pow">← POW ({{ ef.pow }})</span></label>
              <input v-model.number="ef.mp_max" type="number" class="form-input" />
            </div>
            <div v-if="hasMindPoints" class="field-group">
              <label>Mind Points (Current)<span class="field-help" :data-tooltip="conditionHelp.mind">?</span></label>
              <input v-model.number="ef.mind_current" type="number" class="form-input" />
            </div>
            <div v-if="hasMindPoints" class="field-group">
              <label>Mind Points (Max)<span class="field-help" :data-tooltip="conditionHelp.mind">?</span><span v-if="activeSys === 'coriolis' && ef.wits && ef.empathy" class="derive-hint" @click="ef.mind_max = (ef.wits||0)+(ef.empathy||0)">← WIT+EMP ({{ (ef.wits||0)+(ef.empathy||0) }})</span></label>
              <input v-model.number="ef.mind_max" type="number" class="form-input" />
            </div>
            <div v-if="hasSanity" class="field-group">
              <label>Sanity (Current)<span class="field-help" :data-tooltip="conditionHelp.sanity">?</span></label>
              <input v-model.number="ef.sanity_current" type="number" class="form-input" />
            </div>
            <div v-if="hasSanity" class="field-group">
              <label>Sanity (Max)<span class="field-help" :data-tooltip="conditionHelp.sanity">?</span></label>
              <input v-model.number="ef.sanity_max" type="number" class="form-input" />
            </div>
            <div v-if="hasRadiation" class="field-group">
              <label>Radiation<span class="field-help" :data-tooltip="conditionHelp.rad">?</span></label>
              <input v-model.number="ef.radiation" type="number" class="form-input" min="0" />
            </div>
          </div>

          <!-- Conditions (ALIEN) -->
          <template v-if="hasConditions">
            <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em">Conditions</div>
            <div style="display:flex;flex-wrap:wrap;gap:12px">
              <label v-for="c in conditions" :key="c" class="condition-check">
                <input type="checkbox" v-model="ef['cond_' + c]" />
                <span>{{ c.charAt(0).toUpperCase() + c.slice(1) }}<span v-if="alienConditionHelp[c]" class="field-help" :data-tooltip="alienConditionHelp[c]">?</span></span>
              </label>
            </div>
          </template>

          <!-- Status flags (boolean extra fields — CoC wound/insanity) -->
          <template v-if="extraFields.some(f => f.type === 'boolean')">
            <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em">Status</div>
            <div style="display:flex;flex-wrap:wrap;gap:12px">
              <label v-for="f in extraFields.filter(f => f.type === 'boolean')" :key="f.key" class="condition-check">
                <input type="checkbox" v-model="ef[f.key]" />
                <span>{{ f.label }}<span v-if="f.help" class="field-help" :data-tooltip="f.help">?</span></span>
              </label>
            </div>
          </template>

          <!-- ALIEN Wound Locations -->
          <template v-if="activeSys === 'alien' && woundLocations.length">
            <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em">Broken — Hit Location</div>
            <div style="display:flex;flex-wrap:wrap;gap:12px">
              <label v-for="loc in woundLocations" :key="loc" class="condition-check">
                <input type="checkbox" v-model="ef['wnd_' + loc]" />
                <span>{{ loc.charAt(0).toUpperCase() + loc.slice(1) }}</span>
              </label>
            </div>
          </template>

          <!-- ALIEN Consumables section -->
          <template v-if="activeSys === 'alien'">
            <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em">Consumables</div>
            <div class="edit-stats-grid">
              <div v-for="k in ['cons_air','cons_food','cons_water','cons_power']" :key="k" class="field-group">
                <label>{{ k.split('_')[1].charAt(0).toUpperCase() + k.split('_')[1].slice(1) }}<span class="field-help" :data-tooltip="consumableHelp[k]">?</span></label>
                <input v-model.number="ef[k]" type="number" min="0" class="form-input" placeholder="0" />
              </div>
            </div>
          </template>
        </template>

        </template><!-- /identity -->

        <!-- ── SKILLS ───────────────────────────────────── -->
        <template v-else-if="activePage === 'skills'">

        <!-- System Skills -->
        <template v-if="systemSkills.length">
          <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em">Skills</div>

          <!-- CoC: % skills in compact 3-col grid -->
          <template v-if="activeSys === 'coc'">
            <div class="skills-coc-grid">
              <div v-for="sk in systemSkills" :key="sk.key" class="coc-skill-row">
                <span class="coc-skill-label">{{ sk.label }}</span>
                <span class="coc-skill-base">{{ sk.note || sk.base + '%' }}</span>
                <input v-model.number="ef[sk.key]" type="number" min="0" max="100" class="coc-skill-input form-input" placeholder="—" />
              </div>
            </div>
          </template>

          <!-- YZE dice skills (ALIEN / Coriolis) -->
          <template v-else-if="activeSys === 'alien' || activeSys === 'coriolis'">
            <template v-if="hasSkillGroups">
              <div style="font-size:0.72em;opacity:0.45;margin-bottom:6px">General</div>
            </template>
            <div class="skills-yze-grid">
              <div v-for="sk in (hasSkillGroups ? generalSkills : systemSkills)" :key="sk.key" class="yze-skill-row">
                <span class="yze-skill-label">{{ sk.label }}<span v-if="sk.attr" class="yze-attr"> ({{ sk.attr }})</span></span>
                <input v-model.number="ef[sk.key]" type="number" min="0" max="5" class="yze-skill-input form-input" placeholder="0" />
              </div>
            </div>
            <template v-if="hasSkillGroups">
              <div style="font-size:0.72em;opacity:0.45;margin:12px 0 6px">Advanced</div>
              <div class="skills-yze-grid">
                <div v-for="sk in advancedSkills" :key="sk.key" class="yze-skill-row">
                  <span class="yze-skill-label">{{ sk.label }}<span v-if="sk.attr" class="yze-attr"> ({{ sk.attr }})</span></span>
                  <input v-model.number="ef[sk.key]" type="number" min="0" max="5" class="yze-skill-input form-input" placeholder="0" />
                </div>
              </div>
            </template>
          </template>

          <!-- Dune: skill rank + focus -->
          <template v-else-if="activeSys === 'dune'">
            <div class="skills-focus-grid">
              <div v-for="sk in systemSkills" :key="sk.key" class="focus-skill-row">
                <span class="focus-skill-label">{{ sk.label }}<span v-if="sk.attr" class="yze-attr"> ({{ sk.attr }})</span><span v-if="sk.help" class="field-help" :data-tooltip="sk.help">?</span></span>
                <input v-model.number="ef[sk.key]" type="number" min="0" max="5" class="focus-rank-input form-input" placeholder="0" />
                <input v-model="ef[sk.key + '_focus']" class="focus-input form-input" placeholder="Focus…" />
              </div>
            </div>
            <!-- Drives -->
            <div v-if="hasDrives" style="margin-top:14px">
              <div style="font-size:0.75em;opacity:0.55;margin-bottom:8px;letter-spacing:.05em">Drives</div>
              <div class="edit-stats-grid">
                <div v-for="d in drives" :key="d" class="field-group">
                  <label>{{ d.charAt(0).toUpperCase() + d.slice(1) }}<span class="field-help" :data-tooltip="driveHelp[d]">?</span></label>
                  <input v-model.number="ef['drv_' + d]" type="number" min="0" max="20" class="form-input" placeholder="0" />
                </div>
              </div>
            </div>
          </template>

          <!-- Achtung! Cthulhu: skill rank + focus -->
          <template v-else-if="activeSys === 'achtung'">
            <div class="skills-focus-grid">
              <div v-for="sk in systemSkills" :key="sk.key" class="focus-skill-row">
                <span class="focus-skill-label">{{ sk.label }}<span v-if="sk.attr" class="yze-attr"> ({{ sk.attr }})</span><span v-if="sk.help" class="field-help" :data-tooltip="sk.help">?</span></span>
                <input v-model.number="ef[sk.key]" type="number" min="0" max="3" class="focus-rank-input form-input" placeholder="0" />
                <input v-model="ef[sk.key + '_focus']" class="focus-input form-input" placeholder="Focus…" />
              </div>
            </div>
          </template>
        </template>

        <!-- Custom skills/abilities text inputs -->
        <div class="edit-grid" style="margin-top:4px">
          <div v-if="!systemSkills.length" class="field-group" style="grid-column:1/-1">
            <label>Skills <span style="opacity:.5;font-weight:400">(comma-separated)</span></label>
            <input v-model="ef.skills_text" class="form-input" placeholder="Firearms, First Aid, Spot Hidden…" />
          </div>
          <div class="field-group" style="grid-column:1/-1">
            <label>Abilities / Talents <span style="opacity:.5;font-weight:400">(comma-separated)</span></label>
            <input v-model="ef.abilities_text" class="form-input" placeholder="Combat Training, Nerves of Steel…" />
          </div>
        </div>

        </template><!-- /skills -->

        <!-- ── NOTES ────────────────────────────────────── -->
        <template v-else>

        <!-- Textarea extra fields (Gear, Equipment of Note, Tiny Items) -->
        <template v-for="f in extraFields.filter(f => f.type === 'textarea' && !f.section)" :key="f.key">
          <div style="font-size:0.75em;opacity:0.55;margin:16px 0 6px;letter-spacing:.05em">{{ f.label }}<span v-if="f.help" class="field-help" style="font-size:0.85em;opacity:1" :data-tooltip="f.help">?</span></div>
          <textarea v-model="ef[f.key]" class="form-input" style="min-height:64px;resize:vertical;width:100%"></textarea>
        </template>

        <!-- CoC: My Story, Backstory grid, Fellow Investigators -->
        <template v-if="activeSys === 'coc'">
          <div style="font-size:0.75em;opacity:0.55;margin:20px 0 8px;letter-spacing:.05em">My Story</div>
          <textarea v-model="ef.story" class="form-input" style="min-height:72px;resize:vertical;width:100%" placeholder="The narrative of your investigator's life…"></textarea>

          <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em">Backstory</div>
          <div class="coc-backstory-grid">
            <template v-for="f in extraFields.filter(f => f.section === 'backstory' && f.type !== 'textarea')" :key="f.key">
              <div class="field-group">
                <label>{{ f.label }}<span v-if="f.help" class="field-help" :data-tooltip="f.help">?</span></label>
                <input v-model="ef[f.key]" class="form-input" />
              </div>
            </template>
          </div>

          <!-- Fellow Investigators -->
          <div style="font-size:0.75em;opacity:0.55;margin:20px 0 8px;letter-spacing:.05em">Fellow Investigators</div>
          <div class="coc-fellow-grid">
            <template v-for="n in [1,2,3,4]" :key="n">
              <div class="field-group">
                <label>Char. {{ n }}</label>
                <input v-model="ef['fellow_' + n + '_name']" class="form-input" placeholder="Character name…" />
              </div>
              <div class="field-group">
                <label>Player {{ n }}</label>
                <input v-model="ef['fellow_' + n + '_player']" class="form-input" placeholder="Player name…" />
              </div>
            </template>
          </div>
        </template>

        <!-- Non-CoC: Backstory textarea + Notes textarea -->
        <template v-if="activeSys !== 'coc'">
          <div v-if="activeSys !== 'achtung'" class="field-group" style="margin-top:16px">
            <label>Backstory</label>
            <textarea v-model="ef.backstory" class="form-input" style="min-height:80px;resize:vertical"></textarea>
          </div>
          <div class="field-group" style="margin-top:16px">
            <label>Notes</label>
            <textarea v-model="ef.notes" class="form-input" style="min-height:60px;resize:vertical"></textarea>
          </div>
        </template>

        <!-- Achtung! Cthulhu: Biography, Talents table, Spells table -->
        <template v-if="activeSys === 'achtung'">
          <div style="font-size:0.75em;opacity:0.55;margin:20px 0 6px;letter-spacing:.05em">Biography</div>
          <textarea v-model="ef.biography" class="form-input" style="min-height:80px;resize:vertical;width:100%"
                    placeholder="Your character's history, background and motivations…"></textarea>

          <div style="font-size:0.75em;opacity:0.55;margin:20px 0 8px;letter-spacing:.05em">Talents</div>
          <div style="overflow-x:auto">
            <table class="weapons-table" v-if="ef.acht_talents?.length">
              <thead><tr><th>Name</th><th>Archetype</th><th>Effect</th><th></th></tr></thead>
              <tbody>
                <tr v-for="(t, i) in ef.acht_talents" :key="i">
                  <td><input v-model="t.name"      class="form-input" style="min-width:120px" /></td>
                  <td><input v-model="t.archetype" class="form-input" style="min-width:100px" /></td>
                  <td><input v-model="t.effect"    class="form-input" style="min-width:200px" /></td>
                  <td><button class="btn" style="padding:2px 8px;font-size:0.8em;opacity:.6" @click="ef.acht_talents.splice(i,1)">✕</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <button class="btn" style="margin-top:6px;font-size:0.82em"
                  @click="ef.acht_talents = [...(ef.acht_talents||[]), {name:'',archetype:'',effect:''}]">+ Add Talent</button>

          <div style="font-size:0.75em;opacity:0.55;margin:20px 0 8px;letter-spacing:.05em">Spells</div>
          <div style="overflow-x:auto">
            <table class="weapons-table" v-if="ef.acht_spells?.length">
              <thead><tr><th>Name</th><th>Skill</th><th>Difficulty</th><th>Cost</th><th>Duration</th><th>Effect</th><th>Momentum</th><th></th></tr></thead>
              <tbody>
                <tr v-for="(sp, i) in ef.acht_spells" :key="i">
                  <td><input v-model="sp.name"       class="form-input" style="min-width:110px" /></td>
                  <td><input v-model="sp.skill"      class="form-input" style="min-width:90px" /></td>
                  <td><input v-model="sp.difficulty" class="form-input" style="min-width:80px" /></td>
                  <td><input v-model="sp.cost"       class="form-input" style="min-width:60px" /></td>
                  <td><input v-model="sp.duration"   class="form-input" style="min-width:80px" /></td>
                  <td><input v-model="sp.effect"     class="form-input" style="min-width:180px" /></td>
                  <td><input v-model="sp.momentum"   class="form-input" style="min-width:80px" /></td>
                  <td><button class="btn" style="padding:2px 8px;font-size:0.8em;opacity:.6" @click="ef.acht_spells.splice(i,1)">✕</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <button class="btn" style="margin-top:6px;font-size:0.82em"
                  @click="ef.acht_spells = [...(ef.acht_spells||[]), {name:'',skill:'',difficulty:'',cost:'',duration:'',effect:'',momentum:''}]">+ Add Spell</button>
        </template>

        <!-- Weapons table (for systems with hasWeaponsSection) -->
        <template v-if="hasBuiltinSheet && hasWeaponsSection">
          <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em">Weapons</div>
          <div style="overflow-x:auto">
            <table class="weapons-table" v-if="ef.weapons?.length">
              <thead>
                <tr>
                  <th v-for="col in weaponCols" :key="col">{{ col.charAt(0).toUpperCase() + col.slice(1) }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(w, i) in ef.weapons" :key="i">
                  <td v-for="col in weaponCols" :key="col">
                    <input v-model="w[col]" class="form-input" style="min-width:80px" />
                  </td>
                  <td><button class="btn" style="padding:2px 8px;font-size:0.8em;opacity:.6" @click="removeWeapon(i)">✕</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <button class="btn" style="margin-top:6px;font-size:0.82em" @click="addWeapon">+ Add Weapon</button>
        </template>

        <!-- Critical Injuries textarea (ALIEN / Coriolis) -->
        <template v-if="activeSys === 'alien' || activeSys === 'coriolis'">
          <div style="font-size:0.75em;opacity:0.55;margin:16px 0 6px;letter-spacing:.05em">Critical Injuries</div>
          <textarea v-model="ef.critical_injuries" class="form-input" style="min-height:60px;resize:vertical;width:100%"
                    placeholder="List critical injuries…"></textarea>
        </template>

        <!-- Error message -->
        <div v-if="saveError" class="status-msg status-err" style="margin-top:10px">{{ saveError }}</div>

        </template><!-- /notes -->
        </div><!-- /sheet-page -->
        </Transition>
        </div><!-- /sheet-page-wrap -->

          <div class="doc-footer" aria-hidden="true">
            <span class="footer-caption">{{ alienMode ? 'WEYLAND-YUTANI CORP — PERSONNEL FILE' : 'For authorised eyes only' }}</span>
            <span class="footer-stamp">{{ alienMode ? 'RESTRICTED' : 'Classified' }}</span>
          </div>

        </div><!-- /document-box -->

        </div><!-- /a4-wrap -->

        <!-- Ships / Vehicles (shown on all pages) -->
        <template v-if="ships.length">
          <div class="section-divider" style="margin-top:24px">Ships &amp; Vehicles</div>
          <div class="card-grid" style="margin-top:12px">
            <div v-for="ship in ships" :key="ship.id" class="card" @click="ui.openDetail('ship', ship)">
              <div class="card-body">
                <div class="card-title">{{ ship.name }}</div>
                <div class="card-meta">
                  <span v-if="ship.class" class="tag">{{ ship.class }}</span>
                  <span v-if="ship.condition" class="tag" :class="conditionClass(ship.condition)">{{ ship.condition }}</span>
                </div>
                <div v-if="ship.hull_max != null" style="margin-top:8px">
                  <div style="font-size:0.75em;opacity:0.6;margin-bottom:3px">Hull: {{ ship.hull_current ?? ship.hull_max }} / {{ ship.hull_max }}</div>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="`width:${hullPercent(ship)}%;background:var(--blue,#4c7ac9)`"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>


    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { renderMd } from '@/utils/markdown'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import { useSystemFeatures } from '@/composables/useSystemFeatures'

const route = useRoute()
const router = useRouter()
const data = useDataStore()
const auth = useAuthStore()
const campaign = useCampaignStore()
const ui = useUiStore()
const {
  hasStress, hasSanity, hasDndBeyond, hasBuiltinSheet, coreStats, cocEraLabel,
  hasMagicPoints, hasMindPoints, hasConditions, hasRadiation, hasDrives,
  extraFields, systemSkills, conditions, woundLocations, drives,
} = useSystemFeatures()

const activeSys = computed(() => campaign.activeCampaign?.system || 'custom')

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
const generalSkills  = computed(() => systemSkills.value.filter(s => s.group === 'general'))
const advancedSkills = computed(() => systemSkills.value.filter(s => s.group === 'advanced'))
const hasSkillGroups = computed(() => systemSkills.value.some(s => s.group))

const conditionHelp = computed(() => {
  const s = activeSys.value
  return {
    hp:     s === 'coc'     ? 'HP = (CON + SIZ) ÷ 10, rounded up. A Major Wound = losing ½ HP in one hit.'
          : s === 'coriolis'? 'HP Max = Strength + Agility. Reach 0 and you are Broken.'
          : s === 'alien'   ? 'Lose all HP and you suffer a critical injury. Roll on the crit table.'
          : s === 'dune'    ? 'Lose all HP and you are taken out of the scene.'
          : s === 'achtung' ? 'Lose all HP and suffer a Wound. Two Wounds and you are incapacitated.'
          : 'Hit Points — reach 0 and your character is down.',
    stress: s === 'alien'   ? 'Stress adds bonus dice but triggers Panic rolls. Starts at 0; rises when you push rolls or face horror.'
          : s === 'achtung' ? 'Stress capacity = your Will attribute. Lose your last point and suffer Confusion.'
          : 'Stress points — track mental strain for this system.',
    sanity: s === 'coc'     ? 'Sanity starts at POW × 5 (max 99). Cthulhu Mythos skill permanently reduces the maximum.'
          : s === 'achtung' ? 'Sanity = resistance to Mythos horror. Lost through encounters with the unnatural.'
          : 'Sanity — mental stability for this system.',
    mp:     'Magic Points = POW. Spent to cast spells and resist magical effects. Recovers with rest.',
    mind:   'Mind Points = Wits + Empathy. Lose all Mind Points and suffer a Trauma (permanent unless treated).',
    rad:    s === 'alien'   ? 'Radiation Sickness. Each point = –1 to all rolls. Reach your STR score and you die.'
          : s === 'coriolis'? 'Radiation exposure. Each point = –1 to all rolls. Treated by a Medicurgy roll between scenes.'
          : 'Radiation level — accumulates from environmental hazards.',
  }
})
const alienConditionHelp = {
  starving:    'No food consumed. –1 to all Strength-based rolls. Worsens each day without eating.',
  dehydrated:  'No water consumed. –2 to all rolls. Worsens rapidly — more dangerous than starvation.',
  exhausted:   'No sleep or rest. –1 to all rolls. Push rolls are unavailable until you rest.',
  freezing:    'Exposed to extreme cold. –1 to all rolls. Requires shelter or heated gear to remove.',
}
const consumableHelp = {
  cons_air:   'Supply units of breathable air. Reach 0 in a sealed environment and suffocation begins.',
  cons_food:  'Ration units. Reach 0 and gain the Starving condition after one day.',
  cons_water: 'Water units. Reach 0 and gain the Dehydrated condition after one day.',
  cons_power: 'Power cells for equipment. Reach 0 and powered gear stops working.',
}
const driveHelp = {
  duty:    'Commitment to your House or organisation. High Duty means following orders even at personal cost.',
  faith:   'Belief in a higher power or ideology. High Faith grants inner resolve against fear and temptation.',
  justice: 'Adherence to fairness and law. High Justice drives you to right wrongs regardless of consequence.',
  power:   'Desire for influence and control. High Power motivates ruthless ambition and resource acquisition.',
  truth:   'Pursuit of knowledge and honesty. High Truth compels you to seek facts over convenient fictions.',
}
const cocIdea = computed(() => sheet.value?.int ? sheet.value.int * 5 : null)
const cocKnow = computed(() => sheet.value?.edu ? sheet.value.edu * 5 : null)
const cocBuildRaw = computed(() => {
  const s = sheet.value; if (!s) return null
  const total = (s.str ?? 0) + (s.siz ?? 0)
  if (total <= 12)  return -2
  if (total <= 16)  return -1
  if (total <= 24)  return 0
  if (total <= 32)  return 1
  if (total <= 40)  return 2
  return Math.floor((total - 40) / 8) + 2
})
const cocBuild = computed(() => {
  const b = cocBuildRaw.value; if (b === null) return '—'
  return b >= 0 ? '+' + b : String(b)
})
const cocDamageBonus = computed(() => {
  const b = cocBuildRaw.value; if (b === null) return '—'
  if (b <= -2) return '-2'
  if (b === -1) return '-1'
  if (b === 0)  return 'None'
  if (b === 1)  return '+1d4'
  if (b === 2)  return '+1d6'
  if (b === 3)  return '+1d8'
  if (b === 4)  return '+1d10'
  return '+2d6'
})
const cocMove = computed(() => {
  const s = sheet.value; if (!s) return '—'
  const str = s.str ?? 0, dex = s.dex ?? 0, siz = s.siz ?? 0
  let move = (str < siz && dex < siz) ? 7 : (str > siz && dex > siz) ? 9 : 8
  const age = s.age ?? 0
  if (age >= 80) move -= 5
  else if (age >= 70) move -= 4
  else if (age >= 60) move -= 3
  else if (age >= 50) move -= 2
  else if (age >= 40) move -= 1
  return Math.max(1, move)
})

const sheet = ref(null)
const ships = ref([])
const loading = ref(false)
const saving = ref(false)
const saveError = ref('')
const saveStatus = ref('')  // '' | 'saving' | 'saved' | 'error'
const selectedUserId = ref('')
const activePage = ref('identity') // 'identity' | 'skills' | 'notes'
const flipDirection = ref('forward') // controls page-flip CSS transition direction

const pages = [
  { id: 'identity', label: 'Identity' },
  { id: 'skills',   label: 'Skills'   },
  { id: 'notes',    label: 'Notes'    },
]
const pageIndex = computed(() => pages.findIndex(p => p.id === activePage.value))
const flipTransition = computed(() => `flip-${flipDirection.value}`)

function goToPage(idx) {
  const current = pageIndex.value
  if (idx === current) return
  flipDirection.value = idx > current ? 'forward' : 'backward'
  activePage.value = pages[idx].id
}
function prevPage() { goToPage(pageIndex.value - 1) }
function nextPage() { goToPage(pageIndex.value + 1) }

// When loaded via ?id= from CharactersView, use new characters API
const characterId = computed(() => route.query.id ? Number(route.query.id) : null)
const dossierMode = computed(() => activeSys.value === 'achtung')
const cocMode     = computed(() => activeSys.value === 'coc')
const alienMode   = computed(() => activeSys.value === 'alien')

// Edit form
const ef = ref({})

let _saveTimer = null
let _watchSuppressed = false
watch(ef, () => {
  if (!sheet.value || _watchSuppressed) return
  if (_saveTimer) clearTimeout(_saveTimer)
  saveStatus.value = ''
  _saveTimer = setTimeout(() => saveSheet(), 1500)
}, { deep: true })

function startEdit() {
  _watchSuppressed = true
  const s = sheet.value || {}
  ef.value = {
    name: s.name || '',
    class: s.class || '',
    race: s.race || '',
    level: s.level || 1,
    background: s.background || '',
    concept: s.concept || '',
    portrait_url: s.portrait_url || s.sheet_data?.portrait_url || '',
    hp_current: s.hp_current ?? null,
    hp_max: s.hp_max ?? null,
    stress_current: s.stress_current ?? null,
    stress_max: s.stress_max ?? null,
    mp_current: s.mp_current ?? null,
    mp_max: s.mp_max ?? null,
    mind_current: s.mind_current ?? null,
    mind_max: s.mind_max ?? null,
    sanity_current: s.sanity_current ?? null,
    sanity_max: s.sanity_max ?? null,
    radiation: s.radiation ?? null,
    skills_text: (s.skills || []).join(', '),
    abilities_text: (s.abilities || []).join(', '),
    backstory: s.backstory || '',
    notes: s.notes || '',
    dnd_beyond_url: s.dnd_beyond_url || '',
    // core stats — all systems
    str: s.str ?? null, dex: s.dex ?? null, con: s.con ?? null,
    int: s.int ?? null, wis: s.wis ?? null, cha: s.cha ?? null,
    strength: s.strength ?? null, agility: s.agility ?? null,
    wits: s.wits ?? null, empathy: s.empathy ?? null,
    siz: s.siz ?? null, app: s.app ?? null, edu: s.edu ?? null,
    pow: s.pow ?? null, luck: s.luck ?? null,
    bod: s.bod ?? null, agi: s.agi ?? null, mnd: s.mnd ?? null,
    soc: s.soc ?? null, spi: s.spi ?? null,
    // Achtung! Cthulhu attributes
    ach_agi: s.ach_agi ?? null, ach_brawn: s.ach_brawn ?? null,
    ach_coord: s.ach_coord ?? null, ach_insight: s.ach_insight ?? null,
    ach_reason: s.ach_reason ?? null, ach_will: s.ach_will ?? null,
  }
  // Extra system-specific identity fields
  extraFields.value.forEach(f => {
    if (f.type === 'boolean') ef.value[f.key] = s[f.key] ?? false
    else if (f.type === 'number') ef.value[f.key] = s[f.key] ?? null
    else ef.value[f.key] = s[f.key] ?? ''
  })
  // System skills
  systemSkills.value.forEach(sk => {
    ef.value[sk.key] = s[sk.key] ?? null
    if (activeSys.value === 'dune' || activeSys.value === 'achtung') {
      ef.value[sk.key + '_focus'] = s[sk.key + '_focus'] ?? ''
    }
  })
  // Conditions (ALIEN)
  conditions.value.forEach(c => {
    ef.value['cond_' + c] = s['cond_' + c] ?? false
  })
  // Drives (Dune)
  drives.value.forEach(d => {
    ef.value['drv_' + d] = s['drv_' + d] ?? null
  })
  // Weapons
  ef.value.weapons = (s.weapons || []).map(w => ({ ...w }))
  // Critical injuries (ALIEN / Coriolis)
  ef.value.critical_injuries = s.critical_injuries || ''
  // Achtung! Cthulhu structured tables
  if (activeSys.value === 'achtung') {
    ef.value.acht_talents = (s.acht_talents || []).map(t => ({ ...t }))
    ef.value.acht_spells  = (s.acht_spells  || []).map(t => ({ ...t }))
  }
  nextTick(() => { _watchSuppressed = false })
}

const hasStats = computed(() => coreStats.value.some(s => sheet.value?.[s.key] != null))

const hpPercent = computed(() => {
  if (!sheet.value?.hp_max) return 0
  return Math.round(((sheet.value.hp_current ?? sheet.value.hp_max) / sheet.value.hp_max) * 100)
})

const stressPercent = computed(() => {
  if (!sheet.value?.stress_max) return 0
  return Math.round(((sheet.value.stress_current ?? 0) / sheet.value.stress_max) * 100)
})
const mpPercent = computed(() => {
  if (!sheet.value?.mp_max) return 0
  return Math.round(((sheet.value.mp_current ?? sheet.value.mp_max) / sheet.value.mp_max) * 100)
})
const mindPercent = computed(() => {
  if (!sheet.value?.mind_max) return 0
  return Math.round(((sheet.value.mind_current ?? sheet.value.mind_max) / sheet.value.mind_max) * 100)
})
const sanityPercent = computed(() => {
  if (!sheet.value?.sanity_max) return 0
  return Math.round(((sheet.value.sanity_current ?? sheet.value.sanity_max) / sheet.value.sanity_max) * 100)
})

function hullPercent(ship) {
  if (!ship.hull_max) return 0
  return Math.round(((ship.hull_current ?? ship.hull_max) / ship.hull_max) * 100)
}

// Weapon columns per system
const weaponCols = computed(() => {
  if (activeSys.value === 'coc')    return ['name','damage','range','attacks','ammo']
  if (activeSys.value === 'achtung') return ['name','focus','range','damage','ammo','size','qualities']
  return ['name','bonus','damage','range']           // ALIEN / Coriolis / default
})
const hasWeaponsSection = computed(() =>
  ['coc','alien','coriolis','achtung','custom'].includes(activeSys.value)
)
function addWeapon() {
  const row = {}
  weaponCols.value.forEach(c => { row[c] = '' })
  ef.value.weapons = [...(ef.value.weapons || []), row]
}
function removeWeapon(i) {
  ef.value.weapons = ef.value.weapons.filter((_, idx) => idx !== i)
}

function conditionClass(c) {
  const v = c?.toLowerCase()
  if (v === 'operational') return 'tag-active'
  if (v === 'damaged' || v === 'destroyed') return 'tag-inactive'
  return ''
}

async function loadSheet() {
  loading.value = true
  try {
    if (characterId.value) {
      // New characters API — loaded via ?id= from CharactersView
      const r = await data.apif(`/api/characters/${characterId.value}`)
      if (r.ok) {
        const d = await r.json()
        const raw = d.character
        sheet.value = raw ? { ...raw, ...(raw.sheet_data || {}) } : null
      } else {
        sheet.value = null
      }
    } else {
      // Legacy path: load by user id from old character-sheets API
      const uid = campaign.isGm && selectedUserId.value ? selectedUserId.value : auth.currentUser?.id
      if (!uid) return
      const r = await data.apif(`/api/character-sheets/${uid}`)
      if (r.ok) {
        const d = await r.json()
        const raw = d.sheet
        sheet.value = raw ? { ...raw, ...(raw.sheet_data || {}) } : null
      } else {
        sheet.value = null
      }
    }
    // Always populate ef from the loaded sheet
    startEdit()
    const rs = await data.apif('/api/character-sheets/ships/all')
    if (rs.ok) ships.value = (await rs.json()).ships || []
  } catch (e) {
    console.error('[CharacterSheet]', e)
    sheet.value = null
  } finally {
    loading.value = false
  }
}

async function saveSheet() {
  saving.value = true
  saveStatus.value = 'saving'
  saveError.value = ''
  try {
    const uid = campaign.isGm && selectedUserId.value ? selectedUserId.value : auth.currentUser?.id
    if (!uid) throw new Error('No user selected')
    const campId = campaign.activeCampaign?.id
    const sys = campaign.activeCampaign?.system || 'custom'

    const sheetData = {}
    if (hasBuiltinSheet.value) {
      const statKeys = [
        'str','dex','con','int','wis','cha','strength','agility','wits','empathy',
        'siz','app','edu','pow','luck','bod','agi','mnd','soc','spi',
        'ach_agi','ach_brawn','ach_coord','ach_insight','ach_reason','ach_will',
      ]
      statKeys.forEach(k => { if (ef.value[k] != null) sheetData[k] = ef.value[k] })
      sheetData.name = ef.value.name
      sheetData.class = ef.value.class
      sheetData.race = ef.value.race
      sheetData.level = ef.value.level
      sheetData.background = ef.value.background
      sheetData.concept = ef.value.concept
      sheetData.hp_current = ef.value.hp_current
      sheetData.hp_max = ef.value.hp_max
      sheetData.stress_current = ef.value.stress_current
      sheetData.stress_max = ef.value.stress_max
      if (ef.value.mp_current != null) sheetData.mp_current = ef.value.mp_current
      if (ef.value.mp_max     != null) sheetData.mp_max     = ef.value.mp_max
      if (ef.value.mind_current   != null) sheetData.mind_current   = ef.value.mind_current
      if (ef.value.mind_max       != null) sheetData.mind_max       = ef.value.mind_max
      if (ef.value.sanity_current != null) sheetData.sanity_current = ef.value.sanity_current
      if (ef.value.sanity_max     != null) sheetData.sanity_max     = ef.value.sanity_max
      if (ef.value.radiation      != null) sheetData.radiation      = ef.value.radiation
      sheetData.skills    = ef.value.skills_text.split(',').map(s => s.trim()).filter(Boolean)
      sheetData.abilities = ef.value.abilities_text.split(',').map(s => s.trim()).filter(Boolean)
      sheetData.backstory = ef.value.backstory
      sheetData.notes     = ef.value.notes
      // Extra system-specific identity fields
      extraFields.value.forEach(f => { sheetData[f.key] = ef.value[f.key] })
      // System skills (+ optional focuses)
      systemSkills.value.forEach(sk => {
        if (ef.value[sk.key] != null) sheetData[sk.key] = ef.value[sk.key]
        const fk = sk.key + '_focus'
        if (ef.value[fk]) sheetData[fk] = ef.value[fk]
      })
      // Conditions
      conditions.value.forEach(c => { sheetData['cond_' + c] = ef.value['cond_' + c] ?? false })
      // Drives
      drives.value.forEach(d => { if (ef.value['drv_' + d] != null) sheetData['drv_' + d] = ef.value['drv_' + d] })
      // Weapons + critical injuries
      sheetData.weapons = (ef.value.weapons || []).filter(w => w.name)
      if (ef.value.critical_injuries) sheetData.critical_injuries = ef.value.critical_injuries
      // Achtung! Cthulhu structured tables
      if (sys === 'achtung') {
        sheetData.acht_talents = (ef.value.acht_talents || []).filter(t => t.name)
        sheetData.acht_spells  = (ef.value.acht_spells  || []).filter(t => t.name)
      }
    }
    if (ef.value.portrait_url) sheetData.portrait_url = ef.value.portrait_url

    let r
    if (characterId.value) {
      // Save to new characters API
      r = await data.apif(`/api/characters/${characterId.value}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: sheetData.name || ef.value.name,
          system: sys,
          portrait_url: ef.value.portrait_url || null,
          sheet_data: sheetData,
          campaign_id: campId,
        }),
      })
    } else {
      // Legacy save to character-sheets API
      r = await data.apif(`/api/character-sheets/${uid}`, {
        method: 'PUT',
        body: JSON.stringify({
          campaign_id: campId,
          system: sys,
          sheet_data: sheetData,
          dnd_beyond_url: ef.value.dnd_beyond_url || null,
        }),
      })
    }
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'Save failed') }
    const saved = await r.json()
    // Update sheet in-place without re-fetching (avoids re-triggering the watcher)
    const raw = saved.sheet || saved.character
    if (raw) sheet.value = { ...raw, ...(raw.sheet_data || {}) }
    saveStatus.value = 'saved'
    setTimeout(() => { if (saveStatus.value === 'saved') saveStatus.value = '' }, 2000)
  } catch (e) {
    saveError.value = e.message
    saveStatus.value = 'error'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (characterId.value || !campaign.isGm) loadSheet()
  if (!data.users.length) data.loadUsers()
})
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════════════════
   CHARACTER SHEET — Aged wartime document aesthetic
   Paper: #e8dfc0  |  Header bar: #c8b882  |  Border/ink: #8a7240
   Typeface: Courier Prime (body) + Special Elite (stamps)
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Colour tokens (inherited by all children via cascade) ───────────── */
.page-content {
  --paper:      #e8dfc0;
  --header-bar: #c8b882;
  --border-ink: #8a7240;
  --ink:        #2a1e0a;
  --muted:      rgba(42, 30, 10, 0.55);
  --rule:       rgba(138, 114, 64, 0.20);
  --stamp-red:  #8b1a1a;
  --paper-fill: rgba(180, 160, 100, 0.20);

  background: transparent;
  font-family: 'Courier Prime', 'Courier New', monospace;
  color: var(--ink);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px 48px;
  box-sizing: border-box;
}

/* ── A4 wrap — the tilted document + tabs container ─────────────────── */
.a4-wrap {
  width: min(720px, 90vw);
  position: relative;
  transform: rotate(-0.6deg);
  transform-origin: center top;
  box-shadow:
    0 2px 4px rgba(0,0,0,.15),
    3px 3px 0 rgba(0,0,0,.2),
    6px 6px 0 rgba(0,0,0,.15),
    8px 12px 28px rgba(0,0,0,.55),
    -2px -1px 8px rgba(0,0,0,.2);
}

/* Paper curl at bottom-right corner */
.a4-wrap::after {
  content: '';
  position: absolute;
  bottom: 0; right: 0;
  width: 28px; height: 28px;
  background: linear-gradient(225deg, #b8a87a 45%, rgba(140,110,60,.4) 100%);
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
  z-index: 10;
  pointer-events: none;
}

/* ── Tab bar — sits above the document box ──────────────────────────── */
.doc-tabs-bar {
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  padding: 0 2px;
}

.doc-tabs {
  display: flex;
  gap: 3px;
  align-items: flex-end;
}

/* Folder tabs — sit above the document box top border */
.doc-tab {
  background: #b8a86a;
  border: 1px solid var(--border-ink);
  border-bottom: none;
  border-radius: 3px 3px 0 0;
  color: rgba(42, 30, 10, 0.72);
  font-family: 'Courier Prime', monospace;
  font-size: 0.70em;
  letter-spacing: 0.14em;
  padding: 5px 20px 6px;
  cursor: pointer;
  position: relative;
  transition: background 0.12s, color 0.12s;
}
.doc-tab:hover { color: var(--ink); background: #c8b068; }
.doc-tab.active {
  background: var(--paper);
  color: var(--ink);
  font-weight: 700;
  z-index: 2;
}
/* Active tab covers the document box top border seam */
.doc-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px; left: 0; right: 0;
  height: 1px;
  background: var(--paper);
}

.doc-tabs-right {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 4px;
}

.doc-nav-btn {
  background: transparent;
  border: 1px solid var(--border-ink);
  border-radius: 3px;
  width: 28px; height: 28px;
  cursor: pointer;
  font-size: 1.2em;
  line-height: 1;
  color: var(--ink);
  display: flex; align-items: center; justify-content: center;
  transition: color 0.12s, border-color 0.12s;
  flex-shrink: 0;
}
.doc-nav-btn:hover:not(:disabled) { border-color: var(--stamp-red); color: var(--stamp-red); }
.doc-nav-btn:disabled { opacity: 0.25; cursor: default; }

/* ── Document box — paper surface ───────────────────────────────────── */
.document-box {
  width: 100%;
  background: var(--paper);
  border: 1px solid var(--border-ink);
  position: relative;
}

/* Lined paper texture across the full document */
.document-box::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    0deg,
    transparent 0,
    transparent 31px,
    rgba(120, 100, 60, 0.07) 31px,
    rgba(120, 100, 60, 0.07) 32px
  );
  z-index: 0;
}

/* ── Box header — title left, CLASSIFIED stamp right ─────────────────── */
.doc-box-header {
  background: var(--header-bar);
  border-bottom: 2px solid var(--border-ink);
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

.doc-box-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-family: 'Courier Prime', 'Courier New', monospace !important;
  font-size: 1.3em !important;
  font-weight: 700 !important;
  letter-spacing: 0.12em !important;
  text-transform: none;
  color: var(--ink) !important;
}
.page-title::after { display: none !important; }

.back-link {
  color: var(--stamp-red) !important;
  font-family: 'Courier Prime', monospace !important;
  font-size: 0.8em !important;
}

/* ── CLASSIFIED stamp ────────────────────────────────────────────────── */
.classified-stamp {
  font-family: 'Special Elite', cursive;
  font-size: 1.0em;
  color: var(--stamp-red);
  border: 3px double var(--stamp-red);
  padding: 3px 14px;
  letter-spacing: 0.28em;
  transform: rotate(-2deg);
  opacity: 0.85;
  mix-blend-mode: multiply;
  user-select: none;
  flex-shrink: 0;
}

/* ── Sheet page wrap — inside the document box ───────────────────────── */
.sheet-page-wrap {
  position: relative;
  z-index: 1;
}

.sheet-page {
  position: relative;
  z-index: 1;
  background: transparent !important;
  padding: 20px 32px 32px !important;
  font-family: 'Courier Prime', 'Courier New', monospace;
  color: var(--ink);
}

/* ── All inputs/selects/textareas: transparent, border-bottom only ────── */
.form-input {
  background: transparent !important;
  border: none !important;
  border-bottom: 1px solid rgba(138, 114, 64, 0.45) !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  color: var(--ink) !important;
  font-family: 'Courier Prime', 'Courier New', monospace !important;
  font-size: 0.97em !important;
  padding: 2px 0 1px !important;
  width: 100%;
}
.form-input:focus {
  outline: none !important;
  box-shadow: none !important;
  border-bottom-color: var(--border-ink) !important;
}
.form-input::placeholder { color: rgba(42, 30, 10, 0.32) !important; }
textarea.form-input { resize: vertical; }

/* ── Field group labels: small-caps ──────────────────────────────────── */
.field-group > label {
  font-family: 'Courier Prime', monospace !important;
  font-size: 0.76em !important;
  font-variant: small-caps !important;
  letter-spacing: 0.08em !important;
  color: rgba(42, 30, 10, 0.72) !important;
  font-weight: 700 !important;
}

/* ── Section sub-headers (inline-styled divs with text-transform/letter-spacing) */
.sheet-page > [style*="letter-spacing"],
.sheet-page > div > [style*="letter-spacing"] {
  font-family: 'Courier Prime', monospace !important;
  font-variant: small-caps !important;
  font-size: 0.74em !important;
  font-weight: 700 !important;
  letter-spacing: 0.14em !important;
  color: var(--ink) !important;
  opacity: 1 !important;
  border-left: 3px solid var(--border-ink) !important;
  padding-left: 7px !important;
  margin-top: 14px !important;
  margin-bottom: 6px !important;
}

/* ── Stat display boxes ──────────────────────────────────────────────── */
.stat-box {
  background: var(--paper-fill) !important;
  border: 1px solid var(--border-ink) !important;
  border-radius: 2px !important;
  padding: 10px;
  text-align: center;
}
.stat-label {
  font-size: 0.65em;
  letter-spacing: 1px;
  color: var(--muted) !important;
  font-family: 'Courier Prime', monospace;
  font-variant: small-caps;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 1.4em;
  font-weight: 700;
  color: var(--ink) !important;
}

/* ── Doc footer — inside document box ───────────────────────────────── */
.doc-footer {
  background: var(--header-bar);
  border-top: 2px solid var(--border-ink);
  padding: 6px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: 'Courier Prime', monospace;
  font-size: 0.65em;
  color: rgba(42, 30, 10, 0.60);
  letter-spacing: 0.16em;
  position: relative;
  z-index: 1;
}
.footer-stamp {
  font-family: 'Special Elite', cursive;
  font-size: 1.3em;
  color: var(--stamp-red);
  opacity: 0.65;
  letter-spacing: 0.22em;
}

/* ── Save indicator ──────────────────────────────────────────────────── */
.sheet-save-indicator {
  font-family: 'Courier Prime', monospace !important;
  font-size: 0.7em;
  letter-spacing: 0.06em;
}
.sheet-save-indicator.saving { color: var(--muted) !important; }
.sheet-save-indicator.saved  { color: #3a5c18 !important; }
.sheet-save-indicator.error  { color: var(--stamp-red) !important; }

/* HP/stress progress bars */
.progress-bar {
  background: var(--border);
  border-radius: 99px;
  height: 6px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.3s ease;
  min-width: 2px;
}

/* D&D Beyond banner */
.beyond-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--surface2, rgba(255,255,255,.04));
  border: 1px solid var(--accent);
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
}
.beyond-banner-name { font-size: 1.1em; font-weight: 700; color: var(--accent); }
.beyond-banner-sub { font-size: 0.8em; opacity: 0.55; margin-top: 2px; }
.beyond-btn { flex-shrink: 0; }

.beyond-placeholder {
  background: var(--surface2, rgba(255,255,255,.04));
  border: 1px dashed var(--border);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  margin-bottom: 20px;
}

/* Edit form grids */
.edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.edit-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

/* ── Large screen scaling ────────────────────────────────────────────── */
@media (min-width: 1280px) {
  .a4-wrap { width: min(900px, 75vw); }
  .page-content { padding: 40px 48px 60px; }
}
@media (min-width: 1600px) {
  .a4-wrap { width: min(1060px, 70vw); }
  .page-content { padding: 48px 80px 80px; }
}
@media (min-width: 1920px) {
  .a4-wrap { width: min(1200px, 65vw); }
}

/* ── Small screen scaling ────────────────────────────────────────────── */
@media (max-width: 800px) {
  .page-content { padding: 20px 12px 36px; }
  .a4-wrap { transform: rotate(-0.4deg); }
}
@media (max-width: 500px) {
  .page-content { padding: 12px 8px 24px; }
  .a4-wrap { transform: rotate(-0.2deg); }
}
@media (max-width: 600px) {
  .edit-grid { grid-template-columns: 1fr; }
  .beyond-banner { flex-direction: column; align-items: flex-start; }
}

/* ── CoC skill edit grid ─────────────────────────────── */
.skills-coc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 4px 10px;
}
.coc-skill-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.coc-skill-label { flex: 1; font-size: 0.82em; }
.coc-skill-base  { font-size: 0.72em; opacity: 0.45; white-space: nowrap; }
.coc-skill-input { width: 58px !important; text-align: center; padding: 3px 6px !important; }

/* ── CoC skill view grid ─────────────────────────────── */
.skills-coc-view-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 3px 8px;
}
.coc-view-row {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 0;
  border-bottom: 1px solid var(--border, rgba(255,255,255,.05));
}
.coc-view-label    { flex: 1; font-size: 0.82em; }
.coc-view-base     { font-size: 0.72em; opacity: 0.38; white-space: nowrap; }
.coc-view-val      { font-size: 0.88em; font-weight: 600; min-width: 36px; text-align: right; }
.coc-view-hard     { font-size: 0.78em; opacity: 0.52; min-width: 34px; text-align: right; }
.coc-view-extreme  { font-size: 0.78em; opacity: 0.36; min-width: 30px; text-align: right; }
.coc-raised .coc-view-val { color: var(--accent, #c9a84c); }
.coc-view-legend {
  display: flex;
  gap: 5px;
  padding-bottom: 4px;
  font-size: 0.68em;
  opacity: 0.4;
  letter-spacing: 0.04em;
}
.coc-view-legend span:first-child { flex: 1; }
.coc-view-legend span:not(:first-child) { min-width: 34px; text-align: right; white-space: nowrap; }
.coc-view-legend span:nth-child(2) { min-width: auto; }

/* ── YZE skill edit grid ─────────────────────────────── */
.skills-yze-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 5px 10px;
}
.yze-skill-row  { display: flex; align-items: center; gap: 6px; }
.yze-skill-label { flex: 1; font-size: 0.82em; }
.yze-attr       { font-size: 0.75em; opacity: 0.45; }
.yze-skill-input { width: 52px !important; text-align: center; padding: 3px 6px !important; }

/* ── YZE skill view ──────────────────────────────────── */
.skills-yze-view { display: flex; flex-direction: column; gap: 4px; }
.yze-view-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  border-bottom: 1px solid var(--border, rgba(255,255,255,.05));
}
.yze-view-label { flex: 1; font-size: 0.85em; }
.yze-view-attr  { font-size: 0.75em; opacity: 0.4; }
.yze-view-dice  { display: flex; gap: 2px; }
.die-pip        { font-size: 0.85em; opacity: 0.2; }
.die-pip.active { opacity: 1; color: var(--accent, #c9a84c); }

/* ── Focus skill edit grid (Dune / Achtung) ──────────── */
.skills-focus-grid { display: flex; flex-direction: column; gap: 5px; }
.focus-skill-row   { display: flex; align-items: center; gap: 6px; }
.focus-skill-label { width: 130px; font-size: 0.82em; }
.focus-rank-input  { width: 52px !important; text-align: center; padding: 3px 6px !important; }
.focus-input       { flex: 1; }

/* ── Focus skill view ────────────────────────────────── */
.skills-focus-view { display: flex; flex-direction: column; gap: 4px; }
.focus-view-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  border-bottom: 1px solid var(--border, rgba(255,255,255,.05));
}
.focus-view-label { flex: 1; font-size: 0.85em; }
.focus-view-rank  { font-size: 0.95em; font-weight: 700; min-width: 24px; text-align: center; color: var(--accent, #c9a84c); }
.focus-view-focus { font-size: 0.75em; opacity: 0.5; font-style: italic; }

/* ── Weapons table ───────────────────────────────────── */
.weapons-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82em;
}
.weapons-table th {
  text-align: left;
  font-size: 0.72em;
  letter-spacing: 0.06em;
  font-variant: small-caps;
  color: var(--muted, rgba(42,30,10,.55));
  padding: 4px 6px 6px;
  border-bottom: 1px solid var(--border-ink, #8a7240);
}
.weapons-table td {
  padding: 4px 6px;
  border-bottom: 1px solid rgba(138, 114, 64, 0.25);
  vertical-align: middle;
  color: var(--ink, #2a1e0a);
}
.weapons-table--view td { opacity: 0.85; }
.weapons-table .form-input { padding: 3px 6px !important; font-size: 0.9em; }

/* ── Field help badge (?-icon tooltip trigger) ───────── */
.field-help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 1px solid currentColor;
  font-size: 0.6em;
  font-weight: 700;
  margin-left: 5px;
  cursor: help;
  opacity: 0.4;
  vertical-align: middle;
  line-height: 1;
  user-select: none;
  position: relative;
}
.field-help:hover { opacity: 1; }
.field-help::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg2, #1e1e2e);
  color: var(--text1, #cdd6f4);
  border: 1px solid var(--border, rgba(255,255,255,0.12));
  padding: 7px 11px;
  border-radius: 6px;
  font-size: 1.55em;
  font-weight: 400;
  line-height: 1.45;
  white-space: normal;
  width: 240px;
  max-width: 80vw;
  pointer-events: none;
  opacity: 0;
  z-index: 200;
  text-transform: none;
  letter-spacing: 0;
  font-family: inherit;
  transition: opacity 0.12s;
  box-shadow: 0 4px 16px rgba(0,0,0,0.35);
}
.field-help:hover::after { opacity: 1; }

/* Tooltip colours in dossier / CoC light-paper modes */
.dossier-mode .field-help::after,
.coc-mode .field-help::after {
  background: #2a1a08;
  color: #e8d5a3;
  border-color: rgba(90, 55, 10, 0.50);
  box-shadow: 2px 2px 8px rgba(0,0,0,0.40);
  font-family: 'Special Elite', 'Courier New', monospace;
}

/* ── Derived-stat auto-fill hint ─────────────────────── */
.derive-hint {
  font-size: 0.72em;
  opacity: 0.5;
  cursor: pointer;
  margin-left: 8px;
  text-decoration: underline dotted;
  font-weight: 400;
}
.derive-hint:hover { opacity: 0.85; }

/* ── Condition checkbox ──────────────────────────────── */
.condition-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85em;
  cursor: pointer;
}
.condition-check input { accent-color: var(--accent, #c9a84c); }

/* ── CoC era banner ──────────────────────────────────── */
.coc-era-banner {
  font-size: 0.68em;
  letter-spacing: 0.12em;
  color: var(--accent, #b8a060);
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
  margin-bottom: 14px;
  font-family: 'JetBrains Mono', monospace;
  opacity: 0.8;
}

/* ── CoC fellow investigators grid (edit mode) ───────── */
.coc-fellow-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
@media (max-width: 480px) {
  .coc-fellow-grid { grid-template-columns: 1fr; }
}

/* ── CoC backstory grid (edit mode) ─────────────────── */
.coc-backstory-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
@media (max-width: 540px) {
  .coc-backstory-grid { grid-template-columns: 1fr; }
}

/* ── CoC backstory view grid ─────────────────────────── */
.coc-backstory-view-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 20px;
}
@media (max-width: 540px) {
  .coc-backstory-view-grid { grid-template-columns: 1fr; }
}
.coc-bv-item { display: flex; flex-direction: column; gap: 2px; }
.coc-bv-label {
  font-size: 0.68em;
  letter-spacing: 0.06em;
  opacity: 0.45;
}
.coc-bv-value { font-size: 0.87em; opacity: 0.9; line-height: 1.4; }

/* ── CoC fellow investigators view ───────────────────── */
.coc-fellow-view { display: flex; flex-direction: column; gap: 6px; }
.coc-fellow-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.87em;
}
.coc-fellow-num   { opacity: 0.35; min-width: 16px; }
.coc-fellow-char  { font-weight: 600; color: var(--accent, #b8a060); }
.coc-fellow-sep   { opacity: 0.35; }
.coc-fellow-player{ opacity: 0.65; }

/* ── Achtung! Cthulhu sheet styling ─────────────────── */
.acht-sheet-card {
  /* Olive-green left accent stripe */
  border-left: 3px solid var(--accent-yellow, #e9c46a);
}
.acht-card-header {
  font-size: 0.68em;
  letter-spacing: 0.14em;
  font-family: 'JetBrains Mono', monospace;
  color: var(--accent-yellow, #e9c46a);
  border-bottom: 1px solid var(--border2, #6a7258);
  padding-bottom: 6px;
  margin-bottom: 12px;
}
.acht-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.83em;
}
.acht-table th {
  text-align: left;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78em;
  letter-spacing: 0.08em;
  color: var(--accent-yellow, #e9c46a);
  border-bottom: 1px solid var(--border2, #6a7258);
  padding: 4px 8px;
  opacity: 0.85;
}
.acht-table td {
  padding: 5px 8px;
  border-bottom: 1px solid var(--border, #505840);
  color: var(--text2);
  vertical-align: top;
  line-height: 1.4;
}
.acht-table tr:last-child td { border-bottom: none; }
.acht-td-name { font-weight: 600; color: var(--text); min-width: 110px; }
.acht-td-arch { font-style: italic; min-width: 90px; }
.acht-empty   { font-size: 0.83em; opacity: 0.3; font-style: italic; }

/* ── Edit-mode wrapper (themed, no hover lift) ──────── */
.sheet-edit-wrap {
  margin-bottom: 16px;
  background: var(--surface);
  border: 1px solid var(--card-inner, var(--accent));
  border-radius: var(--radius, 6px);
  padding: 20px;
}

/* Back link */
.back-link {
  font-size: 0.75em;
  color: var(--accent);
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.05em;
  opacity: 0.7;
  white-space: nowrap;
}
.back-link:hover { opacity: 1; }

/* Portrait in view mode */
.char-portrait-wrap {
  flex-shrink: 0;
  width: 100px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border);
}
.char-portrait-full {
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  display: block;
}
.char-portrait-empty {
  width: 100%;
  aspect-ratio: 3 / 4;
  background: var(--surface2, #2a2a3a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6em;
  font-weight: 700;
  opacity: 0.2;
  font-family: 'JetBrains Mono', monospace;
}

/* ── Page flip container ─────────────────────────────────── */
.sheet-page-wrap {
  position: relative;
  overflow: hidden;
}

/* ── Page slide transition ──────────────────────────────────────────────
 * Pages slide horizontally like physical document pages being moved across
 * a desk. The leaving page exits in the direction of travel; the incoming
 * page enters from the opposite side.
 * ──────────────────────────────────────────────────────────────────────── */

/* GPU layer hint — both pages during transition */
.flip-forward-leave-active,  .flip-forward-enter-active,
.flip-backward-leave-active, .flip-backward-enter-active {
  will-change: transform, opacity;
}

/* ── Forward (→): current slides left, next slides in from right ── */
.flip-forward-leave-active {
  position: absolute; width: 100%; top: 0; left: 0; z-index: 2;
  animation: slideOutLeft 0.28s ease-in forwards;
}
.flip-forward-enter-active {
  z-index: 1;
  animation: slideInRight 0.28s ease-out both;
}

/* ── Backward (←): current slides right, prev slides in from left ── */
.flip-backward-leave-active {
  position: absolute; width: 100%; top: 0; left: 0; z-index: 2;
  animation: slideOutRight 0.28s ease-in forwards;
}
.flip-backward-enter-active {
  z-index: 1;
  animation: slideInLeft 0.28s ease-out both;
}

/* ── Keyframes ─────────────────────────────────────────────────── */
@keyframes slideOutLeft {
  from { transform: translateX(0);     opacity: 1; }
  to   { transform: translateX(-100%); opacity: 0.3; }
}
@keyframes slideInRight {
  from { transform: translateX(100%);  opacity: 0.3; }
  to   { transform: translateX(0);     opacity: 1; }
}
@keyframes slideOutRight {
  from { transform: translateX(0);    opacity: 1; }
  to   { transform: translateX(100%); opacity: 0.3; }
}
@keyframes slideInLeft {
  from { transform: translateX(-100%); opacity: 0.3; }
  to   { transform: translateX(0);     opacity: 1; }
}

/* ══════════════════════════════════════════════════════════════════════════
   WW2 Dossier — Achtung! Cthulhu / CoC shared light-paper foundation
   ══════════════════════════════════════════════════════════════════════════
   STRATEGY: override ALL CSS custom properties at the mode root.
   Every child element using var(--text), var(--surface), var(--border), etc.
   automatically picks up the correct light-paper colours.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Dossier (Achtung!) ── aged manila military document ─────────────── */
.dossier-mode {
  /* Remap theme tokens → light-paper equivalents */
  --bg:       #e8d5a3;
  --bg2:      #dcc88a;
  --bg3:      #d0bc76;
  --surface:  transparent;
  --surface2: transparent;
  --border:   rgba(90, 55, 10, 0.22);
  --border2:  rgba(90, 55, 10, 0.40);
  --text:     #1a0d04;
  --text2:    #3d2008;
  --text3:    #6a4418;
  --accent:   #8b1a1a;
  --accent2:  #a82222;
  --accent-yellow: #5a3e22;
  --input-bg: transparent;
  --hover-glow: none;
  /* Local palette shorthand */
  --dos-paper: #e8d5a3;
  --dos-ink:   #1a0d04;
  --dos-sepia: #4a2c08;
  --dos-rule:  rgba(90, 55, 10, 0.20);
  --dos-stamp: #8b1a1a;
  --dos-tab:   #d4bc7a;
  color: #1a0d04;
  font-family: 'Special Elite', 'Courier New', monospace;
}

/* Sheet page — manila with 32px ruled lines */
.dossier-mode .sheet-page {
  background-color: var(--dos-paper) !important;
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 31px,
    rgba(90, 55, 10, 0.12) 31px,
    rgba(90, 55, 10, 0.12) 32px
  ) !important;
  background-attachment: local !important;
  color: var(--dos-ink);
}

/* Page title — typewriter / stamp style, dark ink */
.dossier-mode .page-title {
  font-family: 'Special Elite', 'Courier New', monospace !important;
  color: var(--dos-ink) !important;
  letter-spacing: 0.14em;
}
.dossier-mode .page-title::after { background: var(--dos-sepia) !important; opacity: 0.3; }
.dossier-mode .back-link { color: var(--dos-stamp) !important; }

/* All cards and surfaces — transparent, no box */
.dossier-mode .card,
.dossier-mode .sheet-header-card,
.dossier-mode .beyond-banner,
.dossier-mode .beyond-placeholder {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

/* Stat boxes — ruled-line bottom only */
.dossier-mode .stat-box {
  background: transparent !important;
  border: none !important;
  border-bottom: 1px solid var(--dos-rule) !important;
  border-radius: 0 !important;
}

/* Inputs / selects — form line style (bottom border only) */
.dossier-mode input,
.dossier-mode select {
  background: transparent !important;
  border: none !important;
  border-bottom: 1px solid var(--dos-rule) !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  color: var(--dos-ink) !important;
  font-family: 'Special Elite', 'Courier New', monospace !important;
  padding-left: 2px !important;
}
.dossier-mode textarea {
  background: transparent !important;
  border: 1px solid var(--dos-rule) !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  color: var(--dos-ink) !important;
  font-family: 'Special Elite', 'Courier New', monospace !important;
}
.dossier-mode input:focus,
.dossier-mode textarea:focus,
.dossier-mode select:focus {
  border-bottom-color: var(--dos-stamp) !important;
  outline: none !important;
  box-shadow: none !important;
}
.dossier-mode input::placeholder,
.dossier-mode textarea::placeholder { color: rgba(90, 55, 10, 0.30) !important; }

/* Section headers (Achtung card headers) */
.dossier-mode .acht-card-header {
  color: var(--dos-sepia) !important;
  border-bottom: 1px solid var(--dos-rule) !important;
  font-family: 'Special Elite', 'Courier New', monospace !important;
  letter-spacing: 0.14em;
}
.dossier-mode .acht-table th {
  color: var(--dos-sepia) !important;
  border-bottom: 1px solid var(--dos-rule) !important;
  font-family: 'Special Elite', 'Courier New', monospace !important;
}
.dossier-mode .acht-table td {
  color: var(--dos-ink) !important;
  border-bottom: 1px solid var(--dos-rule) !important;
}

/* Page navigation — manila folder tabs */
.dossier-mode .doc-tab {
  background: var(--dos-tab) !important;
  border-color: rgba(90, 55, 10, 0.35) !important;
  color: var(--dos-sepia) !important;
  font-family: 'Special Elite', 'Courier New', monospace !important;
  letter-spacing: 0.08em;
}
.dossier-mode .doc-tab::after { background: var(--dos-paper) !important; }
.dossier-mode .doc-tab.active {
  background: var(--dos-paper) !important;
  border-color: var(--dos-stamp) !important;
  color: var(--dos-stamp) !important;
}
.dossier-mode .doc-tab.active::after { background: var(--dos-paper) !important; }
.dossier-mode .doc-nav-btn {
  background: var(--dos-tab) !important;
  border-color: rgba(90, 55, 10, 0.35) !important;
  color: var(--dos-sepia) !important;
}
.dossier-mode .doc-nav-btn:hover:not(:disabled) {
  border-color: var(--dos-stamp) !important;
  color: var(--dos-stamp) !important;
}

/* Save indicator */
.dossier-mode .sheet-save-indicator {
  font-family: 'Special Elite', 'Courier New', monospace !important;
}
.dossier-mode .sheet-save-indicator.saved  { color: #2e5c1a !important; }
.dossier-mode .sheet-save-indicator.saving { color: var(--dos-sepia) !important; }
.dossier-mode .sheet-save-indicator.error  { color: var(--dos-stamp) !important; }

/* ── Ledger row-grid alignment: 32px atomic unit (dossier only) ──────── */
/*
 * Each field occupies EXACTLY one ruled line (32px):
 *   label (uppercase, left ~42%) + input (right, fills remaining) = 32px row
 * No margin between consecutive fields — they stack flush on the lines.
 * Section subheadings use one blank row (32px) as a visual separator.
 */
.dossier-mode {
  --R: 32px;
}

/* All box-sizing inherited */
.dossier-mode .sheet-page * {
  box-sizing: border-box;
}

/* Field group = one horizontal ruled row */
.dossier-mode .field-group {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  min-height: var(--R);
  margin: 0 !important;
  padding: 0 !important;
  gap: 8px;
}

/* Label: left 42%, uppercase, vertically centred, no wrap */
.dossier-mode .field-group > label {
  flex: 0 0 42%;
  max-width: 42%;
  height: var(--R);
  line-height: var(--R) !important;
  display: flex !important;
  align-items: center !important;
  overflow: hidden;
  white-space: nowrap;
  font-size: 0.60em !important;
  letter-spacing: 0.10em;
  margin: 0 !important;
  padding: 0 !important;
}

/* Input / select: fills the right side, exactly one row tall */
.dossier-mode input,
.dossier-mode select {
  height: var(--R) !important;
  line-height: var(--R) !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  flex: 1;
}

/* Textareas: grow in 32px steps */
.dossier-mode textarea {
  line-height: var(--R) !important;
  padding: calc(var(--R) * 0.25) 4px !important;
  min-height: calc(var(--R) * 2) !important;
}

/* Section subheadings — one full 32px row, flush margins */
.dossier-mode [style*="letter-spacing:.05em"],
.dossier-mode [style*="letter-spacing: .05em"] {
  height: var(--R) !important;
  line-height: var(--R) !important;
  margin: 0 !important;
  padding: 0 !important;
  display: flex !important;
  align-items: flex-end !important;
}
/* Also target margin-top/bottom inline styles on section headers */
.dossier-mode [style*="margin:16px 0"] {
  margin: 0 !important;
  height: var(--R) !important;
  line-height: var(--R) !important;
  display: flex !important;
  align-items: flex-end !important;
}

/* edit-stats-grid: stat label sits left, wider label area for short stat names */
.dossier-mode .edit-stats-grid .field-group > label {
  flex: 0 0 55%;
  max-width: 55%;
}

/* Collapse grid row gaps so rows sit flush on the ruled lines */
.dossier-mode .edit-grid,
.dossier-mode .edit-stats-grid {
  row-gap: 0 !important;
}

/* Remove number-input spinners — they inflate row height above 32px */
.dossier-mode input[type="number"] {
  -moz-appearance: textfield;
}
.dossier-mode input[type="number"]::-webkit-inner-spin-button,
.dossier-mode input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Checkboxes: restore normal inline layout (not flex-row stretch) */
.dossier-mode .condition-check {
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center !important;
  min-height: unset !important;
  height: auto !important;
  gap: 5px;
  font-size: 0.82em;
}

/* ── Save status indicator ───────────────────────────── */
.sheet-save-indicator {
  font-size: 0.7em;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.06em;
  padding: 3px 8px;
  border-radius: 3px;
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;
}
.sheet-save-indicator.saving,
.sheet-save-indicator.saved,
.sheet-save-indicator.error { opacity: 1; }
.sheet-save-indicator.saving { color: var(--text3); }
.sheet-save-indicator.saved  { color: #4caf50; }
.sheet-save-indicator.error  { color: #e74c3c; }

/* ══════════════════════════════════════════════════════════════════════════
   CoC — Investigator File Paper Document
   Design tokens from design artefacts/CharacterSheetCoC.vue:
     Paper:   #e8dfc0  |  Header:  #c8b882  |  Border: #8a7240
     Ink:     #2a1a08  |  Mid ink: #4a3a18  |  Faded:  #6a5428
     Placeholder: #a89a6a           |  Stamp:  #8b1a1a
   Font: Courier Prime (same as base — no override needed)
   ══════════════════════════════════════════════════════════════════════════ */

/* ── CoC ink colour on root ─────────────────────────────────────────── */
.coc-mode { color: #2a1a08; }

/* ── Document box ────────────────────────────────────────────────────── */
.coc-mode .document-box {
  background: #e8dfc0 !important;
  border: 1px solid #8a7240 !important;
}
.coc-mode .document-box::before {
  background-image: repeating-linear-gradient(
    0deg,
    transparent 0,
    transparent 27px,
    rgba(120,100,60,.07) 27px,
    rgba(120,100,60,.07) 28px
  ) !important;
}

/* ── Box header ─────────────────────────────────────────────────────── */
.coc-mode .doc-box-header {
  background: #c8b882 !important;
  border-bottom: 2px solid #8a7240 !important;
}

/* ── Sheet page wrapper ─────────────────────────────────────────────── */
.coc-mode .sheet-page-wrap {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* ── Doc footer ─────────────────────────────────────────────────────── */
.coc-mode .doc-footer {
  background: #c8b882 !important;
  border-top: 2px solid #8a7240 !important;
}

/* ── Sheet page ─────────────────────────────────────────────────────── */
.coc-mode .sheet-page {
  background-color: #e8dfc0 !important;
  background-image: none !important;
  color: #2a1a08;
  font-size: 1rem;
  padding: 16px 18px 18px;
  box-sizing: border-box;
}
.coc-mode .sheet-page * { box-sizing: border-box; }

/* ── Cards: transparent ──────────────────────────────────────────── */
.coc-mode .card,
.coc-mode .sheet-header-card,
.coc-mode .beyond-banner,
.coc-mode .beyond-placeholder,
.coc-mode .stat-box {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

/* ── Back-link / title in box header ────────────────────────────── */
.coc-mode .page-title {
  font-size: 1.1em !important;
  letter-spacing: 0.12em !important;
  color: #2a1a08 !important;
}
.coc-mode .back-link {
  color: #6a5428 !important;
  font-size: 0.82em !important;
}
.coc-mode .classified-stamp {
  color: #8b1a1a !important;
  border-color: #8b1a1a !important;
}

/* ── Stamp circle ──────────────────────────────────────────────── */
.coc-stamp-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(32px * 7);
  margin-bottom: 32px;
}

.coc-stamp-circle {
  width: 220px;
  height: 220px;
  border: 4px solid #8b1a1a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transform: rotate(-8deg);
  color: #8b1a1a;
  font-weight: bold;
  text-align: center;
  mix-blend-mode: multiply;
  opacity: 0.85;
  background: transparent;
}

.coc-stamp-circle::before {
  content: '';
  position: absolute;
  inset: 12px;
  border: 2px dashed #8b1a1a;
  border-radius: 50%;
  opacity: 0.6;
  pointer-events: none;
}

.coc-stamp-circle::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: repeating-linear-gradient(
    45deg,
    rgba(139,26,26,.08),
    rgba(139,26,26,.08) 2px,
    transparent 2px,
    transparent 5px
  );
  opacity: 0.6;
  pointer-events: none;
}

.coc-stamp-text {
  position: relative;
  z-index: 1;
  font-size: 1.1rem;
  letter-spacing: 2px;
  line-height: 1.5;
}

/* ── Field labels ────────────────────────────────────────────────── */
.coc-mode .field-group {
  display: block !important;
  margin: 0 0 10px !important;
  padding: 0 !important;
}

.coc-mode .field-group > label {
  display: block !important;
  width: 100% !important;
  font-size: 8px !important;
  font-weight: 700 !important;
  letter-spacing: 2px !important;
  color: #6a5428 !important;
  margin: 0 0 2px !important;
  padding: 0 !important;
  white-space: nowrap;
  overflow: hidden;
}

/* Section sub-headings (inline-style selectors) */
.coc-mode [style*="letter-spacing:.05em"],
.coc-mode [style*="letter-spacing: .05em"],
.coc-mode [style*="margin:16px 0"] {
  display: block !important;
  margin: 0 0 6px !important;
  font-size: 9px !important;
  font-weight: 700 !important;
  letter-spacing: 3px !important;
  color: #4a3a18 !important;
  background: #c8b882 !important;
  border-left: 3px solid #8a7240 !important;
  padding: 2px 8px !important;
}

/* ── Inputs & selects ──────────────────────────────────────────── */
.coc-mode input,
.coc-mode select {
  display: block !important;
  width: 100% !important;
  margin: 0 !important;
  padding: 1px 0 !important;
  border: none !important;
  border-bottom: 1px solid #8a7240 !important;
  outline: none !important;
  background: transparent !important;
  color: #2a1a08 !important;
  font-family: 'Courier Prime', 'Courier New', monospace !important;
  font-size: 12px !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  flex: unset !important;
  -webkit-appearance: none;
}
.coc-mode input:focus,
.coc-mode select:focus { background: rgba(180,160,100,.2) !important; border-bottom-color: #4a3a18 !important; }

.coc-mode textarea {
  display: block !important;
  width: 100% !important;
  min-height: 55px !important;
  margin: 0 !important;
  padding: 5px !important;
  border: 1px solid #b0a070 !important;
  outline: none !important;
  background: rgba(180,160,100,.1) !important;
  color: #2a1a08 !important;
  font-family: 'Courier Prime', 'Courier New', monospace !important;
  font-size: 10px !important;
  line-height: 1.6 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  resize: vertical;
}

.coc-mode input::placeholder,
.coc-mode textarea::placeholder { color: #a89a6a !important; font-style: italic; }
.coc-mode textarea:focus { border-color: #4a3a18 !important; }

/* Remove number spinners */
.coc-mode input[type="number"] { -moz-appearance: textfield; }
.coc-mode input[type="number"]::-webkit-inner-spin-button,
.coc-mode input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

/* Grids: no column gap interference */
.coc-mode .edit-grid,
.coc-mode .edit-stats-grid { row-gap: 0 !important; }

/* ── Skill rows ──────────────────────────────────────────────────── */
.coc-mode .coc-view-row,
.coc-mode .coc-skill-row {
  border-bottom: 1px dotted #c0b080 !important;
  color: #2a1a08 !important;
}
.coc-mode .coc-view-hard,
.coc-mode .coc-view-extreme,
.coc-mode .coc-view-base,
.coc-mode .coc-skill-base { color: #6a5428 !important; }
.coc-mode .coc-raised .coc-view-val {
  color: #2a1a08 !important;
  font-weight: 700;
  text-decoration: underline;
  text-decoration-color: #8b1a1a;
  text-underline-offset: 3px;
}

/* ── Section card headers ────────────────────────────────────────── */
.coc-mode .acht-card-header {
  font-size: 9px !important;
  font-weight: 700 !important;
  letter-spacing: 3px !important;
  color: #4a3a18 !important;
  background: #c8b882 !important;
  border-left: 3px solid #8a7240 !important;
  border-bottom: none !important;
  padding: 2px 8px !important;
  margin-bottom: 7px !important;
}

/* ── Checkboxes ──────────────────────────────────────────────────── */
.coc-mode .condition-check {
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center !important;
  min-height: unset !important;
  height: auto !important;
  gap: 6px;
  font-size: 0.9rem !important;
  color: #2a1a08 !important;
}

/* ── Page nav tabs ───────────────────────────────────────────────── */
.coc-mode .doc-tab {
  background: #c8b882 !important;
  border-color: #8a7240 !important;
  color: #4a3a18 !important;
  font-size: 0.72em !important;
  letter-spacing: 0.12em !important;
}
.coc-mode .doc-tab::after { background: #e8dfc0 !important; }
.coc-mode .doc-tab.active {
  background: #e8dfc0 !important;
  border-color: #8a7240 !important;
  color: #2a1a08 !important;
}
.coc-mode .doc-tab.active::after { background: #e8dfc0 !important; }
.coc-mode .doc-nav-btn {
  background: transparent !important;
  border-color: #8a7240 !important;
  color: #6a5428 !important;
  box-shadow: none !important;
}
.coc-mode .doc-nav-btn:hover:not(:disabled) {
  border-color: #4a3a18 !important;
  color: #2a1a08 !important;
}

/* ── Tooltips ────────────────────────────────────────────────────── */
.coc-mode .field-help::after {
  background: #2a1a08 !important;
  color: #e8dfc0 !important;
}

/* ── Save indicator ──────────────────────────────────────────────── */
.coc-mode .sheet-save-indicator.saving { color: #6a5428 !important; }
.coc-mode .sheet-save-indicator.saved  { color: #3a6b1e !important; }
.coc-mode .sheet-save-indicator.error  { color: #8b1a1a !important; }

/* ── Mythos glow ─────────────────────────────────────────────────── */
.mythos-glow { animation: mythos-pulse 3.5s ease-in-out infinite; }
@keyframes mythos-pulse {
  0%, 100% { text-shadow: none; opacity: 1; }
  50% {
    text-shadow: 0 0 6px rgba(80,180,80,0.35), 0 0 14px rgba(60,160,60,0.18);
    opacity: 0.82;
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   ALIEN MODE — Weyland-Yutani corporate terminal / MU/TH/UR 6000 uplink
   Overrides the paper/dossier aesthetic with phosphor-on-black CRT terminal
   ══════════════════════════════════════════════════════════════════════════ */

.alien-mode {
  /* Remap all the warm paper tokens to phosphor-green terminal equivalents */
  --paper:      #030f03;
  --header-bar: #020802;
  --border-ink: rgba(74, 240, 74, 0.25);
  --ink:        #4af04a;
  --muted:      rgba(74, 240, 74, 0.50);
  --rule:       rgba(74, 240, 74, 0.06);
  --stamp-red:  #cc3333;
  --paper-fill: rgba(74, 240, 74, 0.04);
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  color: #4af04a;
}

/* No tilt — terminals don't rotate */
.alien-mode .a4-wrap {
  transform: none;
  box-shadow:
    0 0 0 1px rgba(74, 240, 74, 0.20),
    0 4px 40px rgba(0, 0, 0, 0.85);
}

/* No paper curl */
.alien-mode .a4-wrap::after {
  display: none;
}

/* Phosphor scanlines instead of warm sepia lines */
.alien-mode .document-box::before {
  background-image: repeating-linear-gradient(
    0deg,
    transparent 0,
    transparent 31px,
    rgba(74, 240, 74, 0.04) 31px,
    rgba(74, 240, 74, 0.04) 32px
  );
}

/* VT323 display font for the character name header */
.alien-mode .page-title {
  font-family: 'VT323', 'Share Tech Mono', monospace !important;
  color: #8fff8f !important;
  font-size: 1.5em !important;
  font-weight: 400 !important;
  letter-spacing: 0.22em !important;
}

.alien-mode .back-link {
  font-family: 'Share Tech Mono', monospace !important;
  color: #2a9a2a !important;
}

/* RESTRICTED stamp — no rotation, monospace, danger red */
.alien-mode .classified-stamp {
  font-family: 'Share Tech Mono', monospace !important;
  font-size: 0.72em !important;
  color: #cc3333;
  border: 1px solid #cc3333;
  border-style: solid !important;
  transform: none;
  mix-blend-mode: normal;
  letter-spacing: 0.3em;
  opacity: 1;
}

/* Folder tabs → terminal nav buttons */
.alien-mode .doc-tab {
  background: #020802;
  border-color: rgba(74, 240, 74, 0.20);
  color: #2a7a2a;
  font-family: 'Share Tech Mono', monospace !important;
  font-size: 0.68em;
  letter-spacing: 0.18em;
}
.alien-mode .doc-tab:hover {
  background: rgba(74, 240, 74, 0.06);
  color: #4af04a;
}
.alien-mode .doc-tab.active {
  background: #030f03;
  color: #8fff8f;
  border-color: rgba(74, 240, 74, 0.45);
}
.alien-mode .doc-tab::after,
.alien-mode .doc-tab.active::after {
  background: #030f03 !important;
}

.alien-mode .doc-nav-btn {
  font-family: 'Share Tech Mono', monospace !important;
  color: #2a7a2a;
  border-color: rgba(74, 240, 74, 0.20);
}
.alien-mode .doc-nav-btn:hover:not(:disabled) {
  color: #4af04a;
  border-color: rgba(74, 240, 74, 0.55);
}

/* Footer — narrow terminal status bar */
.alien-mode .doc-footer {
  background: #020802;
  border-top-color: rgba(74, 240, 74, 0.15);
  color: #1a5a1a;
  font-family: 'Share Tech Mono', monospace !important;
  letter-spacing: 0.15em;
}
.alien-mode .footer-stamp {
  font-family: 'Share Tech Mono', monospace !important;
  font-size: 0.85em;
  color: #cc3333;
  opacity: 1;
  letter-spacing: 0.3em;
}

/* Save indicator */
.alien-mode .sheet-save-indicator { font-family: 'Share Tech Mono', monospace !important; }
.alien-mode .sheet-save-indicator.saving { color: #2a7a2a !important; }
.alien-mode .sheet-save-indicator.saved  { color: #4af04a !important; }
.alien-mode .sheet-save-indicator.error  { color: #cc3333 !important; }

/* Tooltips */
.alien-mode .field-help::after {
  background: #030f03 !important;
  color: #4af04a !important;
  border-color: rgba(74, 240, 74, 0.30) !important;
}
</style>
