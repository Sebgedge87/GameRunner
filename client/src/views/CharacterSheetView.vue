<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Character</div>
    </div>

    <!-- GM: player selector -->
    <div v-if="campaign.isGm" class="gm-only" style="margin-bottom:16px;max-width:280px">
      <div class="field-group">
        <label>View Player</label>
        <select v-model="selectedUserId" @change="loadSheet">
          <option value="">— Select Player —</option>
          <option v-for="u in data.users" :key="u.id" :value="u.id">{{ u.username }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading sheet...</div>

    <!-- No sheet yet (GM viewing a player who has none) -->
    <div v-else-if="!sheet && !editing" class="empty-state">
      <div>No character sheet yet.</div>
    </div>

    <!-- ── EDIT MODE ──────────────────────────────────── -->
    <template v-else-if="editing">
      <div class="card" style="margin-bottom:16px">
        <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:14px">{{ sheet ? 'EDIT CHARACTER' : 'CREATE CHARACTER' }}</div>

        <!-- D&D Beyond URL (5e only) -->
        <template v-if="hasDndBeyond">
          <div class="field-group" style="margin-bottom:16px">
            <label>D&amp;D Beyond Character URL</label>
            <input v-model="ef.dnd_beyond_url" class="form-input" placeholder="https://www.dndbeyond.com/characters/…" />
            <div style="font-size:0.78em;opacity:0.5;margin-top:4px">Paste the URL from your D&amp;D Beyond character page. Players and GMs can open it directly from here.</div>
          </div>
        </template>

        <!-- Built-in sheet fields (non-5e systems) -->
        <template v-if="hasBuiltinSheet">
          <div class="edit-grid">
            <div class="field-group">
              <label>Character Name</label>
              <input v-model="ef.name" class="form-input" />
            </div>
            <div class="field-group">
              <label>Class / Role</label>
              <input v-model="ef.class" class="form-input" placeholder="e.g. Investigator, Marine…" />
            </div>
            <div class="field-group">
              <label>Race / Species</label>
              <input v-model="ef.race" class="form-input" placeholder="e.g. Human, Android…" />
            </div>
            <div class="field-group">
              <label>Level / Rank</label>
              <input v-model.number="ef.level" type="number" class="form-input" min="1" />
            </div>
            <div class="field-group">
              <label>Background / Occupation</label>
              <input v-model="ef.background" class="form-input" />
            </div>
            <div class="field-group">
              <label>Concept</label>
              <input v-model="ef.concept" class="form-input" placeholder="One-line character concept…" />
            </div>
            <!-- System-specific identity fields -->
            <template v-for="f in extraFields.filter(f => !['buddy_1','buddy_2','buddy_3','buddy_4','major_wound','temp_insanity','indef_insanity','gear','equipment_note','cons_air','cons_food','cons_water','cons_power','tiny_items'].includes(f.key))" :key="f.key">
              <div class="field-group">
                <label>{{ f.label }}</label>
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
            <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em;text-transform:uppercase">Relationships</div>
            <div class="edit-grid">
              <div v-for="n in [1,2,3,4]" :key="n" class="field-group">
                <label>PC {{ n }}</label>
                <input v-model="ef['buddy_' + n]" class="form-input" placeholder="Name…" />
              </div>
            </div>
          </template>

          <!-- Core stats (system-specific) -->
          <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em;text-transform:uppercase">Core Stats</div>
          <div class="edit-stats-grid">
            <div v-for="stat in coreStats" :key="stat.key" class="field-group">
              <label>{{ stat.label }}</label>
              <input v-model.number="ef[stat.key]" type="number" class="form-input" placeholder="0" />
            </div>
          </div>

          <!-- HP / Condition -->
          <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em;text-transform:uppercase">Condition</div>
          <div class="edit-grid">
            <div class="field-group">
              <label>HP (Current)</label>
              <input v-model.number="ef.hp_current" type="number" class="form-input" />
            </div>
            <div class="field-group">
              <label>HP (Max)<span v-if="activeSys === 'coriolis' && ef.strength && ef.agility" class="derive-hint" @click="ef.hp_max = (ef.strength||0)+(ef.agility||0)">← STR+AGL ({{ (ef.strength||0)+(ef.agility||0) }})</span></label>
              <input v-model.number="ef.hp_max" type="number" class="form-input" />
            </div>
            <div v-if="hasStress" class="field-group">
              <label>Stress (Current)</label>
              <input v-model.number="ef.stress_current" type="number" class="form-input" />
            </div>
            <div v-if="hasStress" class="field-group">
              <label>Stress (Max)</label>
              <input v-model.number="ef.stress_max" type="number" class="form-input" />
            </div>
            <div v-if="hasMagicPoints" class="field-group">
              <label>Magic Points (Current)</label>
              <input v-model.number="ef.mp_current" type="number" class="form-input" />
            </div>
            <div v-if="hasMagicPoints" class="field-group">
              <label>Magic Points (Max)<span v-if="activeSys === 'coc' && ef.pow" class="derive-hint" @click="ef.mp_max = ef.pow">← POW ({{ ef.pow }})</span></label>
              <input v-model.number="ef.mp_max" type="number" class="form-input" />
            </div>
            <div v-if="hasMindPoints" class="field-group">
              <label>Mind Points (Current)</label>
              <input v-model.number="ef.mind_current" type="number" class="form-input" />
            </div>
            <div v-if="hasMindPoints" class="field-group">
              <label>Mind Points (Max)<span v-if="activeSys === 'coriolis' && ef.wits && ef.empathy" class="derive-hint" @click="ef.mind_max = (ef.wits||0)+(ef.empathy||0)">← WIT+EMP ({{ (ef.wits||0)+(ef.empathy||0) }})</span></label>
              <input v-model.number="ef.mind_max" type="number" class="form-input" />
            </div>
            <div v-if="hasSanity" class="field-group">
              <label>Sanity (Current)</label>
              <input v-model.number="ef.sanity_current" type="number" class="form-input" />
            </div>
            <div v-if="hasSanity" class="field-group">
              <label>Sanity (Max)</label>
              <input v-model.number="ef.sanity_max" type="number" class="form-input" />
            </div>
            <div v-if="hasRadiation" class="field-group">
              <label>Radiation</label>
              <input v-model.number="ef.radiation" type="number" class="form-input" min="0" />
            </div>
          </div>

          <!-- Conditions (ALIEN) -->
          <template v-if="hasConditions">
            <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em;text-transform:uppercase">Conditions</div>
            <div style="display:flex;flex-wrap:wrap;gap:12px">
              <label v-for="c in conditions" :key="c" class="condition-check">
                <input type="checkbox" v-model="ef['cond_' + c]" />
                <span>{{ c.charAt(0).toUpperCase() + c.slice(1) }}</span>
              </label>
            </div>
          </template>

          <!-- Status flags (boolean extra fields — CoC wound/insanity) -->
          <template v-if="extraFields.some(f => f.type === 'boolean')">
            <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em;text-transform:uppercase">Status</div>
            <div style="display:flex;flex-wrap:wrap;gap:12px">
              <label v-for="f in extraFields.filter(f => f.type === 'boolean')" :key="f.key" class="condition-check">
                <input type="checkbox" v-model="ef[f.key]" />
                <span>{{ f.label }}</span>
              </label>
            </div>
          </template>

          <!-- ALIEN Consumables section -->
          <template v-if="activeSys === 'alien'">
            <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em;text-transform:uppercase">Consumables</div>
            <div class="edit-stats-grid">
              <div v-for="k in ['cons_air','cons_food','cons_water','cons_power']" :key="k" class="field-group">
                <label>{{ k.split('_')[1].charAt(0).toUpperCase() + k.split('_')[1].slice(1) }}</label>
                <input v-model.number="ef[k]" type="number" min="0" class="form-input" placeholder="0" />
              </div>
            </div>
          </template>

          <!-- System Skills -->
          <template v-if="systemSkills.length">
            <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em;text-transform:uppercase">Skills</div>

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
                <div style="font-size:0.72em;opacity:0.45;margin-bottom:6px">GENERAL</div>
              </template>
              <div class="skills-yze-grid">
                <div v-for="sk in (hasSkillGroups ? generalSkills : systemSkills)" :key="sk.key" class="yze-skill-row">
                  <span class="yze-skill-label">{{ sk.label }}<span v-if="sk.attr" class="yze-attr"> ({{ sk.attr }})</span></span>
                  <input v-model.number="ef[sk.key]" type="number" min="0" max="5" class="yze-skill-input form-input" placeholder="0" />
                </div>
              </div>
              <template v-if="hasSkillGroups">
                <div style="font-size:0.72em;opacity:0.45;margin:12px 0 6px">ADVANCED</div>
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
                  <span class="focus-skill-label">{{ sk.label }}</span>
                  <input v-model.number="ef[sk.key]" type="number" min="0" max="5" class="focus-rank-input form-input" placeholder="0" />
                  <input v-model="ef[sk.key + '_focus']" class="focus-input form-input" placeholder="Focus…" />
                </div>
              </div>
              <!-- Drives -->
              <div v-if="hasDrives" style="margin-top:14px">
                <div style="font-size:0.75em;opacity:0.55;margin-bottom:8px;letter-spacing:.05em;text-transform:uppercase">Drives</div>
                <div class="edit-stats-grid">
                  <div v-for="d in drives" :key="d" class="field-group">
                    <label>{{ d.charAt(0).toUpperCase() + d.slice(1) }}</label>
                    <input v-model.number="ef['drv_' + d]" type="number" min="0" max="20" class="form-input" placeholder="0" />
                  </div>
                </div>
              </div>
            </template>

            <!-- Achtung! Cthulhu: skill rank + focus -->
            <template v-else-if="activeSys === 'achtung'">
              <div class="skills-focus-grid">
                <div v-for="sk in systemSkills" :key="sk.key" class="focus-skill-row">
                  <span class="focus-skill-label">{{ sk.label }}</span>
                  <input v-model.number="ef[sk.key]" type="number" min="0" max="3" class="focus-rank-input form-input" placeholder="0" />
                  <input v-model="ef[sk.key + '_focus']" class="focus-input form-input" placeholder="Focus…" />
                </div>
              </div>
            </template>
          </template>

          <!-- Textarea extra fields (Gear & Possessions / Equipment of Note) -->
          <template v-for="f in extraFields.filter(f => f.type === 'textarea')" :key="f.key">
            <div style="font-size:0.75em;opacity:0.55;margin:16px 0 6px;letter-spacing:.05em;text-transform:uppercase">{{ f.label }}</div>
            <textarea v-model="ef[f.key]" class="form-input" style="min-height:64px;resize:vertical;width:100%"></textarea>
          </template>

          <!-- Talents / Abilities (comma-separated, shown when no system skills or for custom) -->
          <div class="edit-grid" style="margin-top:4px">
            <div v-if="!systemSkills.length" class="field-group" style="grid-column:1/-1">
              <label>Skills <span style="opacity:.5;font-weight:400">(comma-separated)</span></label>
              <input v-model="ef.skills_text" class="form-input" placeholder="Firearms, First Aid, Spot Hidden…" />
            </div>
            <div class="field-group" style="grid-column:1/-1">
              <label>Abilities / Talents <span style="opacity:.5;font-weight:400">(comma-separated)</span></label>
              <input v-model="ef.abilities_text" class="form-input" placeholder="Combat Training, Nerves of Steel…" />
            </div>
            <div class="field-group" style="grid-column:1/-1">
              <label>Backstory</label>
              <textarea v-model="ef.backstory" class="form-input" style="min-height:80px;resize:vertical"></textarea>
            </div>
            <div class="field-group" style="grid-column:1/-1">
              <label>Notes</label>
              <textarea v-model="ef.notes" class="form-input" style="min-height:60px;resize:vertical"></textarea>
            </div>
          </div>
        </template>

        <!-- Weapons table -->
        <template v-if="hasBuiltinSheet && hasWeaponsSection">
          <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em;text-transform:uppercase">Weapons</div>
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

        <!-- Critical Injuries (ALIEN / Coriolis) -->
        <template v-if="activeSys === 'alien' || activeSys === 'coriolis'">
          <div style="font-size:0.75em;opacity:0.55;margin:16px 0 6px;letter-spacing:.05em;text-transform:uppercase">Critical Injuries</div>
          <textarea v-model="ef.critical_injuries" class="form-input" style="min-height:60px;resize:vertical;width:100%"
                    placeholder="List critical injuries…"></textarea>
        </template>

        <!-- Portrait URL (all systems) -->
        <div class="field-group" style="margin-top:12px">
          <label>Portrait URL <span style="opacity:.5;font-weight:400">(optional)</span></label>
          <input v-model="ef.portrait_url" class="form-input" placeholder="https://…" />
        </div>

        <div v-if="saveError" class="status-msg status-err" style="margin-top:10px">{{ saveError }}</div>
        <div style="display:flex;gap:8px;margin-top:14px">
          <button class="btn" @click="saveSheet" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
          <button class="btn" style="opacity:.7" @click="cancelEdit">Cancel</button>
        </div>
      </div>
    </template>

    <!-- ── VIEW MODE ──────────────────────────────────── -->
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
        <!-- Character Header -->
        <div class="card" style="margin-bottom:16px">
          <div class="card-body" style="display:flex;gap:20px;align-items:flex-start">
            <div v-if="sheet.portrait_url" style="flex-shrink:0">
              <img :src="sheet.portrait_url" alt="Portrait" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid var(--border)" />
            </div>
            <div style="flex:1">
              <div style="font-size:1.3em;font-weight:600;color:var(--accent)">{{ sheet.name }}</div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
                <span v-if="sheet.class" class="tag">{{ sheet.class }}</span>
                <span v-if="sheet.race" class="tag">{{ sheet.race }}</span>
                <span v-if="sheet.level" class="tag tag-active">Level {{ sheet.level }}</span>
                <span v-if="sheet.background" class="tag">{{ sheet.background }}</span>
              </div>
              <div v-if="sheet.concept" style="font-size:0.85em;opacity:0.7;margin-top:8px;font-style:italic">{{ sheet.concept }}</div>
              <!-- System-specific identity extras (non-boolean, non-textarea) -->
              <div v-if="extraFields.length" style="display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:8px">
                <span v-for="f in extraFields.filter(f => sheet[f.key] && !['boolean','textarea'].includes(f.type) && !['buddy_1','buddy_2','buddy_3','buddy_4'].includes(f.key))"
                      :key="f.key" style="font-size:0.8em;opacity:0.65">
                  <span style="opacity:0.6">{{ f.label }}:</span> {{ sheet[f.key] }}
                </span>
              </div>
              <!-- Active boolean status flags -->
              <div v-if="extraFields.some(f => f.type === 'boolean' && sheet[f.key])" style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px">
                <span v-for="f in extraFields.filter(f => f.type === 'boolean' && sheet[f.key])" :key="f.key"
                      class="tag tag-inactive" style="font-size:0.78em">{{ f.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div v-if="hasStats" class="card" style="margin-bottom:16px">
          <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:12px">STATS</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px">
            <div v-for="stat in coreStats" :key="stat.key" v-show="sheet[stat.key] != null" class="stat-box">
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-value">{{ sheet[stat.key] ?? '—' }}</div>
              <!-- Achtung! Bonus Damage = floor(rating / 2) -->
              <div v-if="activeSys === 'achtung' && sheet[stat.key] != null"
                   style="font-size:0.65em;opacity:0.5;margin-top:2px">BD {{ Math.floor(sheet[stat.key] / 2) }}</div>
            </div>
          </div>
        </div>

        <!-- HP / Condition -->
        <div v-if="sheet.hp_max != null || sheet.stress_max != null || sheet.mp_max != null || sheet.mind_max != null || sheet.radiation != null || (hasSanity && sheet.sanity_max != null)" class="card" style="margin-bottom:16px">
          <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:12px">CONDITION</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div v-if="sheet.hp_max != null">
              <div style="display:flex;justify-content:space-between;font-size:0.8em;opacity:0.7;margin-bottom:4px">
                <span>HP</span><span>{{ sheet.hp_current ?? sheet.hp_max }} / {{ sheet.hp_max }}</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" :style="`width:${hpPercent}%;background:var(--green,#4caf7d)`"></div></div>
              <div v-if="activeSys === 'coriolis'" style="font-size:0.7em;opacity:0.35;margin-top:2px">= Strength + Agility</div>
            </div>
            <div v-if="sheet.stress_max != null">
              <div style="display:flex;justify-content:space-between;font-size:0.8em;opacity:0.7;margin-bottom:4px">
                <span>Stress</span><span>{{ sheet.stress_current ?? 0 }} / {{ sheet.stress_max }}</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" :style="`width:${stressPercent}%;background:var(--red,#c94c4c)`"></div></div>
            </div>
            <div v-if="sheet.mp_max != null">
              <div style="display:flex;justify-content:space-between;font-size:0.8em;opacity:0.7;margin-bottom:4px">
                <span>Magic Points</span><span>{{ sheet.mp_current ?? sheet.mp_max }} / {{ sheet.mp_max }}</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" :style="`width:${mpPercent}%;background:var(--blue,#4c7ac9)`"></div></div>
            </div>
            <div v-if="sheet.mind_max != null">
              <div style="display:flex;justify-content:space-between;font-size:0.8em;opacity:0.7;margin-bottom:4px">
                <span>Mind Points</span><span>{{ sheet.mind_current ?? sheet.mind_max }} / {{ sheet.mind_max }}</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" :style="`width:${mindPercent}%;background:var(--accent,#c9a84c)`"></div></div>
              <div v-if="activeSys === 'coriolis'" style="font-size:0.7em;opacity:0.35;margin-top:2px">= Wits + Empathy</div>
            </div>
            <div v-if="hasSanity && sheet.sanity_max != null">
              <div style="display:flex;justify-content:space-between;font-size:0.8em;opacity:0.7;margin-bottom:4px">
                <span>Sanity</span><span>{{ sheet.sanity_current ?? sheet.sanity_max }} / {{ sheet.sanity_max }}</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" :style="`width:${sanityPercent}%;background:var(--purple,#8c4ac9)`"></div></div>
            </div>
            <div v-if="sheet.radiation != null" style="display:flex;align-items:center;gap:10px;font-size:0.85em">
              <span style="opacity:0.6">Radiation</span>
              <span class="tag" :class="sheet.radiation > 0 ? 'tag-inactive' : ''">{{ sheet.radiation }}</span>
            </div>
          </div>
        </div>

        <!-- Conditions (ALIEN) -->
        <div v-if="hasConditions && conditions.some(c => sheet['cond_' + c])" class="card" style="margin-bottom:16px">
          <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:12px">CONDITIONS</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            <span v-for="c in conditions.filter(c => sheet['cond_' + c])" :key="c" class="tag tag-inactive">
              {{ c.charAt(0).toUpperCase() + c.slice(1) }}
            </span>
          </div>
        </div>

        <!-- Skills — system skills with values -->
        <div v-if="systemSkills.length" class="card" style="margin-bottom:16px">
          <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:12px">SKILLS</div>

          <!-- CoC: compact 3-col % grid -->
          <template v-if="activeSys === 'coc'">
            <!-- Derived: IDEA / KNOW -->
            <div v-if="cocIdea || cocKnow" style="display:flex;gap:12px;margin-bottom:12px">
              <div v-if="cocIdea" class="stat-box" style="min-width:80px">
                <div class="stat-label">IDEA</div><div class="stat-value">{{ cocIdea }}%</div>
              </div>
              <div v-if="cocKnow" class="stat-box" style="min-width:80px">
                <div class="stat-label">KNOW</div><div class="stat-value">{{ cocKnow }}%</div>
              </div>
            </div>
            <!-- Threshold legend -->
            <div class="coc-view-legend">
              <span></span><span>Base</span><span>Reg</span><span title="Hard success (½ skill)">Hard</span><span title="Extreme success (⅕ skill)">Ext</span>
            </div>
            <div class="skills-coc-view-grid">
              <template v-for="sk in systemSkills" :key="sk.key">
                <div v-if="sheet[sk.key] != null" class="coc-view-row" :class="{ 'coc-raised': sheet[sk.key] > sk.base }">
                  <span class="coc-view-label">{{ sk.label }}</span>
                  <span class="coc-view-base">{{ sk.note || sk.base + '%' }}</span>
                  <span class="coc-view-val">{{ sheet[sk.key] }}%</span>
                  <span class="coc-view-hard" title="Hard success">{{ Math.floor(sheet[sk.key] / 2) }}%</span>
                  <span class="coc-view-extreme" title="Extreme success">{{ Math.floor(sheet[sk.key] / 5) }}%</span>
                </div>
              </template>
            </div>
          </template>

          <!-- YZE dice skills (ALIEN / Coriolis) -->
          <template v-else-if="activeSys === 'alien' || activeSys === 'coriolis'">
            <template v-if="hasSkillGroups">
              <div style="font-size:0.72em;opacity:0.45;margin-bottom:6px">GENERAL</div>
            </template>
            <div class="skills-yze-view">
              <div v-for="sk in (hasSkillGroups ? generalSkills : systemSkills)" :key="sk.key" class="yze-view-row">
                <span class="yze-view-label">{{ sk.label }}</span>
                <span v-if="sk.attr" class="yze-view-attr">{{ sk.attr }}</span>
                <span class="yze-view-dice">
                  <span v-for="i in 5" :key="i" class="die-pip" :class="{ active: i <= (sheet[sk.key] || 0) }">●</span>
                </span>
              </div>
            </div>
            <template v-if="hasSkillGroups">
              <div style="font-size:0.72em;opacity:0.45;margin:12px 0 6px">ADVANCED</div>
              <div class="skills-yze-view">
                <div v-for="sk in advancedSkills" :key="sk.key" class="yze-view-row">
                  <span class="yze-view-label">{{ sk.label }}</span>
                  <span v-if="sk.attr" class="yze-view-attr">{{ sk.attr }}</span>
                  <span class="yze-view-dice">
                    <span v-for="i in 5" :key="i" class="die-pip" :class="{ active: i <= (sheet[sk.key] || 0) }">●</span>
                  </span>
                </div>
              </div>
            </template>
          </template>

          <!-- Dune skills with rank + focus -->
          <template v-else-if="activeSys === 'dune'">
            <div class="skills-focus-view">
              <div v-for="sk in systemSkills" :key="sk.key" class="focus-view-row">
                <span class="focus-view-label">{{ sk.label }}</span>
                <span class="focus-view-rank">{{ sheet[sk.key] ?? '—' }}</span>
                <span v-if="sheet[sk.key + '_focus']" class="focus-view-focus">{{ sheet[sk.key + '_focus'] }}</span>
              </div>
            </div>
            <!-- Drives -->
            <template v-if="hasDrives && drives.some(d => sheet['drv_' + d] != null)">
              <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin:14px 0 8px">DRIVES</div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px">
                <div v-for="d in drives" :key="d" class="stat-box">
                  <div class="stat-label">{{ d.toUpperCase() }}</div>
                  <div class="stat-value">{{ sheet['drv_' + d] ?? '—' }}</div>
                </div>
              </div>
            </template>
          </template>

          <!-- Achtung! skills with rank + focus -->
          <template v-else-if="activeSys === 'achtung'">
            <div class="skills-focus-view">
              <div v-for="sk in systemSkills" :key="sk.key" class="focus-view-row">
                <span class="focus-view-label">{{ sk.label }}</span>
                <span class="focus-view-rank">{{ sheet[sk.key] ?? '—' }}</span>
                <span v-if="sheet[sk.key + '_focus']" class="focus-view-focus">{{ sheet[sk.key + '_focus'] }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- Abilities / fallback skills (custom / legacy) -->
        <div v-if="(!systemSkills.length && sheet.skills?.length) || sheet.abilities?.length" class="card" style="margin-bottom:16px">
          <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:12px">SKILLS &amp; ABILITIES</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            <span v-for="s in (!systemSkills.length ? (sheet.skills || []) : [])" :key="s" class="tag">{{ s }}</span>
            <span v-for="a in (sheet.abilities || [])" :key="a" class="tag tag-active">{{ a }}</span>
          </div>
        </div>

        <!-- ALIEN consumables -->
        <div v-if="activeSys === 'alien'" class="card" style="margin-bottom:16px">
          <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:12px">CONSUMABLES</div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;text-align:center">
            <div v-for="k in ['cons_air','cons_food','cons_water','cons_power']" :key="k" class="stat-box">
              <div class="stat-label">{{ k.split('_')[1].toUpperCase() }}</div>
              <div class="stat-value">{{ sheet[k] ?? '—' }}</div>
            </div>
          </div>
        </div>

        <!-- Textarea extra fields (Gear & Possessions / Equipment of Note) -->
        <template v-for="f in extraFields.filter(f => f.type === 'textarea' && sheet[f.key])" :key="f.key">
          <div class="card" style="margin-bottom:16px">
            <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:12px">{{ f.label.toUpperCase() }}</div>
            <div class="prose" style="font-size:0.85em;opacity:0.8;line-height:1.6" v-html="renderMd(sheet[f.key])"></div>
          </div>
        </template>

        <!-- Notes / Backstory -->
        <div v-if="sheet.notes || sheet.backstory" class="card" style="margin-bottom:16px">
          <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:12px">NOTES</div>
          <div v-if="sheet.backstory" class="prose" style="font-size:0.85em;opacity:0.8;margin-bottom:10px;line-height:1.6" v-html="renderMd(sheet.backstory)"></div>
          <div v-if="sheet.notes" class="prose" style="font-size:0.85em;opacity:0.7;line-height:1.6" v-html="renderMd(sheet.notes)"></div>
        </div>

        <!-- Weapons view -->
        <div v-if="sheet.weapons?.length" class="card" style="margin-bottom:16px">
          <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:12px">WEAPONS</div>
          <div style="overflow-x:auto">
            <table class="weapons-table weapons-table--view">
              <thead>
                <tr>
                  <th v-for="col in weaponCols" :key="col">{{ col.charAt(0).toUpperCase() + col.slice(1) }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(w, i) in sheet.weapons" :key="i">
                  <td v-for="col in weaponCols" :key="col">{{ w[col] || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Critical Injuries view (ALIEN / Coriolis) -->
        <div v-if="sheet.critical_injuries" class="card" style="margin-bottom:16px">
          <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:12px">CRITICAL INJURIES</div>
          <div class="prose" style="font-size:0.85em;opacity:0.8;line-height:1.6" v-html="renderMd(sheet.critical_injuries)"></div>
        </div>

        <!-- Ships / Vehicles -->
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

      <!-- Edit button (players edit their own; GM can edit any) -->
      <div v-if="!campaign.isGm || selectedUserId" style="margin-top:24px">
        <button class="btn" @click="startEdit">Edit Sheet</button>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { renderMd } from '@/utils/markdown'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import { useSystemFeatures } from '@/composables/useSystemFeatures'

const data = useDataStore()
const auth = useAuthStore()
const campaign = useCampaignStore()
const ui = useUiStore()
const {
  hasStress, hasSanity, hasDndBeyond, hasBuiltinSheet, coreStats,
  hasMagicPoints, hasMindPoints, hasConditions, hasRadiation, hasDrives,
  extraFields, systemSkills, conditions, drives,
} = useSystemFeatures()

const activeSys = computed(() => campaign.activeCampaign?.system || 'custom')
const generalSkills  = computed(() => systemSkills.value.filter(s => s.group === 'general'))
const advancedSkills = computed(() => systemSkills.value.filter(s => s.group === 'advanced'))
const hasSkillGroups = computed(() => systemSkills.value.some(s => s.group))
const cocIdea = computed(() => sheet.value?.int ? sheet.value.int * 5 : null)
const cocKnow = computed(() => sheet.value?.edu ? sheet.value.edu * 5 : null)

const sheet = ref(null)
const ships = ref([])
const loading = ref(false)
const editing = ref(false)
const saving = ref(false)
const saveError = ref('')
const selectedUserId = ref('')

// Edit form
const ef = ref({})

function startEdit() {
  const s = sheet.value || {}
  ef.value = {
    name: s.name || '',
    class: s.class || '',
    race: s.race || '',
    level: s.level || 1,
    background: s.background || '',
    concept: s.concept || '',
    portrait_url: s.portrait_url || '',
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
  editing.value = true
  saveError.value = ''
}

function cancelEdit() {
  editing.value = false
  saveError.value = ''
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
  if (activeSys.value === 'achtung') return ['name','focus','range','damage','keywords']
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
  editing.value = false
  try {
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
    // Auto-open edit form when the player has no sheet yet
    if (!sheet.value && !campaign.isGm) {
      startEdit()
    }
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
    }
    if (ef.value.portrait_url) sheetData.portrait_url = ef.value.portrait_url

    const r = await data.apif(`/api/character-sheets/${uid}`, {
      method: 'PUT',
      body: JSON.stringify({
        campaign_id: campId,
        system: sys,
        sheet_data: sheetData,
        dnd_beyond_url: ef.value.dnd_beyond_url || null,
      }),
    })
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'Save failed') }
    ui.showToast('Sheet saved', '', '✓')
    await loadSheet()
    editing.value = false
  } catch (e) {
    saveError.value = e.message
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (!campaign.isGm) loadSheet()
  if (!data.users.length) data.loadUsers()
})
</script>

<style scoped>
/* Stat display boxes */
.stat-box {
  background: var(--surface2, #20202e);
  border: 1px solid var(--border, #2a2a3a);
  border-radius: 6px;
  padding: 10px;
  text-align: center;
}
.stat-label {
  font-size: 0.65em;
  letter-spacing: 1px;
  color: var(--text3, #6a6460);
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 1.4em;
  font-weight: 700;
  color: var(--accent, #c9a84c);
}

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
  text-transform: uppercase;
  opacity: 0.45;
  padding: 4px 6px 6px;
  border-bottom: 1px solid var(--border);
}
.weapons-table td {
  padding: 4px 6px;
  border-bottom: 1px solid var(--border, rgba(255,255,255,.05));
  vertical-align: middle;
}
.weapons-table--view td { opacity: 0.85; }
.weapons-table .form-input { padding: 3px 6px !important; font-size: 0.9em; }

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
</style>
