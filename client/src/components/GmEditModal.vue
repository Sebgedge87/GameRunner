<template>
  <div v-if="ui.gmEditModal" class="modal-overlay open" @click.self="ui.closeGmEdit()">
    <div class="modal" :style="{ maxWidth: modalMaxWidth }">
      <div v-if="!isMigratedType" class="modal-title">{{ title }}</div>
      <div class="gm-modal-body">
        <!-- Quest — migrated to EntityForm -->
        <EntityForm v-if="type === 'quest'" :entity-type="title">

          <template #name-field>
            <div class="form-group">
              <label>Title</label>
              <input v-model="f.title" class="form-input" placeholder="A tale of swords and sorcery…" />
            </div>
          </template>

          <template #sidebar-details>
            <div class="form-group">
              <label>Status</label>
              <select v-model="f.status" class="form-input">
                <option>active</option><option>completed</option><option>failed</option><option>hidden</option>
              </select>
            </div>
            <div class="form-group">
              <label>Type</label>
              <select v-model="f.quest_type" class="form-input">
                <option>main</option><option>side</option><option>personal</option>
              </select>
            </div>
            <div class="form-group">
              <label>Urgency</label>
              <select v-model="f.urgency" class="form-input">
                <option value="none">None</option>
                <option value="low">Low</option>
                <option value="high">High — urgent</option>
              </select>
            </div>
            <div class="form-group">
              <label>Deadline (optional)</label>
              <input v-model="f.deadline" class="form-input" placeholder="e.g. 3 sessions / Day 14" />
            </div>
            <div class="form-group">
              <label>Gold reward (optional)</label>
              <input v-model="f.reward_gold" class="form-input" placeholder="e.g. 100" />
            </div>
            <div class="form-group">
              <label>XP reward (optional)</label>
              <input v-model="f.reward_xp" class="form-input" placeholder="e.g. 250" />
            </div>
            <div class="form-group">
              <label>Item rewards (optional)</label>
              <input v-model="f.reward_items" class="form-input" placeholder="Silver dagger, potion of healing…" />
            </div>
            <div class="form-group">
              <label>Parent quest (optional)</label>
              <SearchSelect
                v-model="f.parent_quest_id"
                :options="data.quests.filter(q => q.id !== ui.gmEditModal?.id)"
                :multiple="false"
                label-key="title"
                value-key="id"
                placeholder="Search quests…"
              />
            </div>
          </template>

          <template #main-content>
            <div class="form-group">
              <label>Description</label>
              <MarkdownEditor v-model="f.description" :minRows="6" placeholder="Describe this quest — the problem, stakes, and what the players know so far…" />
            </div>
            <div class="form-group">
              <label>Locations</label>
              <SearchSelect
                v-model="f.connected_locations_arr"
                :options="data.locations.map(l => ({ id: l.id, title: l.title || l.name }))"
                label-key="title"
                placeholder="Search locations…"
              />
            </div>
            <div class="form-group">
              <label>Factions</label>
              <SearchSelect
                v-model="f.connected_factions_arr"
                :options="data.factions.map(fa => ({ id: fa.id, title: fa.name }))"
                label-key="title"
                placeholder="Search factions…"
              />
            </div>
            <div class="form-group">
              <label>NPCs</label>
              <SearchSelect
                v-model="f.connected_npcs_arr"
                :options="data.npcs.map(n => ({ id: n.id, title: n.title || n.name }))"
                label-key="title"
                placeholder="Search NPCs…"
              />
            </div>
            <div class="form-group">
              <label>Banner image (optional)</label>
              <Dropzone
                variant="banner"
                accept="image/*"
                :value="questImgFile || f.image_url || null"
                :on-change="handleQuestImgChange"
                :on-remove="handleQuestImgRemove"
                hint="PNG, JPG up to 5 MB"
              />
            </div>
          </template>

          <template #gm-section>
            <MarkdownEditor v-model="f.gm_notes" :minRows="3" placeholder="Secret information, tactics, hidden motivations…" />
          </template>

        </EntityForm>

        <!-- NPC -->
        <template v-else-if="type === 'npc'">
          <div class="form-group"><label>Name</label><input v-model="f.name" class="form-input" /></div>
          <div class="entity-form-grid">
            <!-- Sidebar -->
            <div class="efg-sidebar">
              <div class="efg-portrait-wrap">
                <Dropzone
                  variant="square"
                  accept="image/*"
                  :value="portraitFile || portraitPreview || null"
                  :on-change="handlePortraitChange"
                  :on-remove="handlePortraitRemove"
                  hint="PNG, JPG"
                />
              </div>
              <div class="efg-stat-block">
                <div class="efg-stat-title">Character</div>
                <div class="form-group">
                  <label class="efg-label">Role</label>
                  <input v-model="f.role" class="form-input" placeholder="Innkeeper, guard…" />
                </div>
                <div class="form-group">
                  <label class="efg-label">Race</label>
                  <input v-model="f.race" class="form-input" placeholder="Human, Elf…" />
                </div>
                <div class="form-group">
                  <label class="efg-label">Disposition</label>
                  <select v-model="f.disposition" class="form-input">
                    <option value="">Unknown</option>
                    <option>Friendly</option><option>Neutral</option><option>Suspicious</option>
                    <option>Hostile</option><option>Helpful</option><option>Fearful</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="efg-label">Faction</label>
                  <EntityLookup v-model="f.faction_id" :options="data.factions.map(x=>({id:x.id,title:x.name}))" placeholder="Search factions…" />
                </div>
                <div class="form-group">
                  <label class="efg-label">Home Location</label>
                  <EntityLookup v-model="f.home_location_id" :options="data.locations.map(x=>({id:x.id,title:x.title||x.name}))" placeholder="Search locations…" />
                </div>
              </div>
            </div>
            <!-- Body -->
            <div class="efg-body">
              <div class="form-group" style="flex:1">
                <label class="efg-label">Biography</label>
                <MarkdownEditor v-model="f.description" :minRows="8" placeholder="Describe this character's appearance, background, and personality…" />
              </div>
              <div class="form-group">
                <label class="efg-label">Player Notes</label>
                <MarkdownEditor v-model="f.player_notes" :minRows="3" placeholder="Notes visible to all players…" />
              </div>
              <div class="efg-gm-notes">
                <div class="efg-gm-hdr"><span class="bst-gm-badge">🔒 GM Only</span><span class="bst-gm-notes-title">Private Notes</span></div>
                <MarkdownEditor v-model="f.gm_notes" :minRows="3" placeholder="Secrets, motivations, hidden knowledge…" />
              </div>
            </div>
          </div>
        </template>

        <!-- Location -->
        <template v-else-if="type === 'location'">
          <div class="form-group"><label>Name</label><input v-model="f.name" class="form-input" /></div>
          <div class="entity-form-grid">
            <!-- Sidebar -->
            <div class="efg-sidebar">
              <div class="efg-portrait-wrap">
                <Dropzone
                  variant="square"
                  accept="image/*"
                  :value="portraitFile || portraitPreview || null"
                  :on-change="handlePortraitChange"
                  :on-remove="handlePortraitRemove"
                  hint="PNG, JPG"
                />
              </div>
              <div class="efg-stat-block">
                <div class="efg-stat-title">Details</div>
                <div class="form-group">
                  <label class="efg-label">Type</label>
                  <select v-model="f.location_type" class="form-input">
                    <option value="">Unknown</option>
                    <option>City</option><option>Town</option><option>Village</option>
                    <option>Dungeon</option><option>Forest</option><option>Keep</option>
                    <option>Tavern</option><option>Temple</option><option>Region</option>
                    <option>Wilderness</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="efg-label">Danger Level (0–5)</label>
                  <input v-model.number="f.danger_level" class="form-input" type="number" min="0" max="5" />
                </div>
              </div>
            </div>
            <!-- Body -->
            <div class="efg-body">
              <div class="form-group" style="flex:1">
                <label class="efg-label">Description</label>
                <MarkdownEditor v-model="f.description" :minRows="8" placeholder="Describe this location — its sights, smells, inhabitants, history…" />
              </div>
              <div class="form-group">
                <label class="efg-label">Parent Location</label>
                <EntityLookup v-model="f.parent_location_id"
                  :options="data.locations.filter(l=>l.id!==ui.gmEditModal?.id).map(x=>({id:x.id,title:x.title||x.name}))"
                  placeholder="Search locations…" />
              </div>
              <div class="form-group">
                <label class="efg-label">Player Notes</label>
                <MarkdownEditor v-model="f.player_notes" :minRows="3" placeholder="Notes visible to all players…" />
              </div>
              <div class="efg-gm-notes">
                <div class="efg-gm-hdr"><span class="bst-gm-badge">🔒 GM Only</span><span class="bst-gm-notes-title">Private Notes</span></div>
                <MarkdownEditor v-model="f.gm_notes" :minRows="3" placeholder="Hidden traps, secret doors, GM-only lore…" />
              </div>
            </div>
          </div>
        </template>

        <!-- Hook -->
        <template v-else-if="type === 'hook'">
          <div class="form-group"><label>Title</label><input v-model="f.title" class="form-input" /></div>
          <div class="form-group"><label>Description</label><textarea v-model="f.description" class="form-input" rows="3"></textarea></div>
          <div class="form-group"><label>Status</label>
            <select v-model="f.status" class="form-input">
              <option>active</option><option>resolved</option><option>hidden</option>
            </select>
          </div>
        </template>

        <!-- Handout -->
        <template v-else-if="type === 'handout'">
          <div class="form-group"><label>Title</label><input v-model="f.title" class="form-input" /></div>
          <div class="form-group">
            <label class="efg-label">Content</label>
            <MarkdownEditor v-model="f.content" :minRows="6" placeholder="Write the handout text your players will receive…" />
          </div>
          <div class="form-group">
            <label class="efg-label">Target Player</label>
            <select v-model="f.user_id" class="form-input">
              <option value="">All Players</option>
              <option v-for="u in players" :key="u.id" :value="u.id">{{ u.username }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="efg-label">Image <span style="color:var(--text3);font-size:10px">(optional)</span></label>
            <Dropzone
              variant="banner"
              accept="image/*"
              :value="portraitFile || handoutImgPreview || null"
              :on-change="handleHandoutImgChange"
              :on-remove="handleHandoutImgRemove"
              hint="PNG, JPG"
            />
          </div>
        </template>

        <!-- Session -->
        <template v-else-if="type === 'session'">
          <div class="form-group"><label>Title</label><input v-model="f.title" class="form-input" /></div>
          <div class="form-group"><label>Summary</label><textarea v-model="f.description" class="form-input" rows="4"></textarea></div>
          <div class="form-group"><label>Session Date</label><input v-model="f.date" class="form-input" type="date" /></div>
        </template>

        <!-- Map -->
        <template v-else-if="type === 'map'">
          <div class="form-group"><label>Title</label><input v-model="f.title" class="form-input" /></div>
          <div class="entity-form-grid">
            <!-- Sidebar -->
            <div class="efg-sidebar">
              <div class="efg-stat-block" style="margin-top:0">
                <div class="efg-stat-title">Details</div>
                <div class="form-group">
                  <label class="efg-label">Type</label>
                  <select v-model="f.map_type" class="form-input">
                    <option value="world">World</option>
                    <option value="region">Region</option>
                    <option value="city">City</option>
                    <option value="dungeon">Dungeon</option>
                    <option value="encounter">Encounter</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="efg-label" style="display:flex;align-items:center;gap:8px;cursor:pointer">
                    <input type="checkbox" v-model="f.map_gm_only" style="width:auto;margin:0" />
                    GM Only
                  </label>
                </div>
              </div>
              <div class="efg-stat-block">
                <div class="efg-stat-title">Map Image</div>
                <div class="form-group">
                  <Dropzone
                    variant="banner"
                    accept="image/*"
                    :value="portraitFile || mapImgPreview || null"
                    :on-change="handleMapImgChange"
                    :on-remove="handleMapImgRemove"
                    hint="PNG, JPG"
                  />
                </div>
              </div>
            </div>
            <!-- Body -->
            <div class="efg-body">
              <div class="form-group">
                <label class="efg-label">Description</label>
                <MarkdownEditor v-model="f.description" :minRows="5" placeholder="Describe this map's region, history, and notable features…" />
              </div>
              <div class="form-group">
                <label class="efg-label">Linked Location</label>
                <EntityLookup v-model="f.map_linked_location_id" :options="data.locations.map(x=>({id:x.id,title:x.title||x.name}))" placeholder="Search locations…" />
              </div>
              <div class="form-group">
                <label class="efg-label">Mind Map Links <span style="font-size:10px;color:var(--text3)">(hold Ctrl/Cmd to multi-select)</span></label>
                <select v-model="f.map_connected_to" class="form-input" multiple style="height:80px">
                  <option v-for="q in data.quests" :key="'q'+q.id" :value="q.title">{{ q.title }} (Quest)</option>
                  <option v-for="n in data.npcs" :key="'n'+n.id" :value="n.title||n.name">{{ n.title||n.name }} (NPC)</option>
                  <option v-for="l in data.locations" :key="'l'+l.id" :value="l.title||l.name">{{ l.title||l.name }} (Location)</option>
                  <option v-for="h in data.hooks" :key="'h'+h.id" :value="h.title">{{ h.title }} (Hook)</option>
                </select>
              </div>
              <div class="efg-gm-notes">
                <div class="efg-gm-hdr"><span class="bst-gm-badge">🔒 GM Only</span><span class="bst-gm-notes-title">Private Notes</span></div>
                <MarkdownEditor v-model="f.gm_notes" :minRows="3" placeholder="Private — players never see this…" />
              </div>
            </div>
          </div>
        </template>

        <!-- Faction -->
        <template v-else-if="type === 'faction'">
          <div class="form-group"><label>Name</label><input v-model="f.name" class="form-input" /></div>
          <div class="entity-form-grid">
            <!-- Sidebar -->
            <div class="efg-sidebar">
              <div class="efg-portrait-wrap">
                <Dropzone
                  variant="square"
                  accept="image/*"
                  :value="portraitFile || portraitPreview || null"
                  :on-change="handlePortraitChange"
                  :on-remove="handlePortraitRemove"
                  hint="PNG, JPG"
                />
              </div>
              <div class="efg-stat-block">
                <div class="efg-stat-title">Status</div>
                <div class="form-group">
                  <label class="efg-label">Standing (−10 to +10)</label>
                  <input v-model.number="f.standing" class="form-input efg-stat-input" type="number" min="-10" max="10" />
                </div>
                <div class="form-group">
                  <label class="efg-label">Influence (1–5)</label>
                  <input v-model.number="f.influence" class="form-input efg-stat-input" type="number" min="1" max="5" />
                </div>
              </div>
            </div>
            <!-- Body -->
            <div class="efg-body">
              <div class="form-group">
                <label class="efg-label">Description / Lore</label>
                <MarkdownEditor v-model="f.description" :minRows="5" placeholder="Describe this faction's history, beliefs, and methods…" />
              </div>
              <div class="form-group">
                <label class="efg-label">Goals</label>
                <MarkdownEditor v-model="f.goals" :minRows="3" placeholder="What does this faction want?" />
              </div>
              <div class="form-group">
                <label class="efg-label">Leader (NPC)</label>
                <EntityLookup v-model="f.leader_npc_id" :options="data.npcs.map(x=>({id:x.id,title:x.title||x.name}))" placeholder="Search NPCs…" />
              </div>
              <div class="form-group">
                <label class="efg-label">Headquarters (Location)</label>
                <EntityLookup v-model="f.hq_location_id" :options="data.locations.map(x=>({id:x.id,title:x.title||x.name}))" placeholder="Search locations…" />
              </div>
              <div class="form-group">
                <label class="efg-label">Members (NPCs)</label>
                <EntityLookup v-model="f.member_ids" :options="data.npcs.map(x=>({id:x.id,title:x.title||x.name}))" :multiple="true" placeholder="Add members…" />
              </div>
              <div class="efg-gm-notes">
                <div class="efg-gm-hdr"><span class="bst-gm-badge">🔒 GM Only</span><span class="bst-gm-notes-title">Private Notes</span></div>
                <MarkdownEditor v-model="f.gm_notes" :minRows="3" placeholder="Internal tensions, secret agendas, hidden members…" />
              </div>
            </div>
          </div>
        </template>

        <!-- Timeline -->
        <template v-else-if="type === 'timeline'">
          <div class="form-group"><label>Title</label><input v-model="f.title" class="form-input" /></div>
          <div class="entity-form-grid">
            <div class="efg-sidebar">
              <div class="efg-stat-block" style="margin-top:0">
                <div class="efg-stat-title">When</div>
                <div class="form-group">
                  <label class="efg-label">In-World Date</label>
                  <input v-model="f.in_world_date" class="form-input" placeholder="Day 14, Year 1502…" />
                </div>
                <div class="form-group">
                  <label class="efg-label">Significance</label>
                  <select v-model="f.significance" class="form-input">
                    <option value="minor">Minor</option>
                    <option value="notable">Notable</option>
                    <option value="major">Major</option>
                    <option value="world-changing">World-Changing</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="efg-body">
              <div class="form-group">
                <label class="efg-label">Event Description</label>
                <MarkdownEditor v-model="f.description" :minRows="7" placeholder="Describe what happened and its impact on the world…" />
              </div>
              <div class="form-group">
                <label class="efg-label">Involved NPCs</label>
                <EntityLookup v-model="f.involved_npc_ids" :options="data.npcs.map(x=>({id:x.id,title:x.title||x.name}))" :multiple="true" placeholder="Add NPCs…" />
              </div>
              <div class="form-group">
                <label class="efg-label">Involved Factions</label>
                <EntityLookup v-model="f.involved_faction_ids" :options="data.factions.map(x=>({id:x.id,title:x.name}))" :multiple="true" placeholder="Add factions…" />
              </div>
              <div class="form-group">
                <label class="efg-label">Linked Quest</label>
                <SearchSelect v-model="f.linked_quest" :options="data.quests" :multiple="false" label-key="title" value-key="title" placeholder="Search quests…" />
              </div>
            </div>
          </div>
        </template>

        <!-- Inventory -->
        <template v-else-if="type === 'inventory'">
          <div class="form-group"><label>Item Name</label><input v-model="f.name" class="form-input" /></div>
          <div class="form-group"><label>Quantity</label><input v-model.number="f.quantity" class="form-input" type="number" min="0" /></div>
          <div class="form-group"><label>Holder</label><input v-model="f.holder" class="form-input" placeholder="party, character name…" /></div>
          <div class="form-group"><label>Description</label><textarea v-model="f.description" class="form-input" rows="2"></textarea></div>
        </template>

        <!-- Key Item -->
        <template v-else-if="type === 'key-item'">
          <div class="form-group"><label>Name</label><input v-model="f.name" class="form-input" /></div>
          <div class="form-group"><label>Description</label><textarea v-model="f.description" class="form-input" rows="3"></textarea></div>
          <div class="form-group"><label>Significance</label><textarea v-model="f.significance" class="form-input" rows="2" placeholder="Why is this important?"></textarea></div>
          <div class="form-group"><label>Linked Quest</label>
            <SearchSelect
              v-model="f.linked_quest"
              :options="data.quests"
              :multiple="false"
              label-key="title"
              value-key="title"
              placeholder="Search quests…"
            />
          </div>
          <div class="form-group">
            <label>Image</label>
            <Dropzone
              variant="square"
              accept="image/*"
              :value="portraitFile"
              :on-change="handlePortraitChange"
              :on-remove="handlePortraitRemove"
              hint="PNG, JPG"
            />
          </div>
        </template>

        <!-- Job -->
        <template v-else-if="type === 'job'">
          <div class="form-group"><label>Title</label><input v-model="f.title" class="form-input" placeholder="Escort the merchant…" /></div>
          <div class="entity-form-grid">
            <div class="efg-sidebar">
              <div class="efg-stat-block" style="margin-top:0">
                <div class="efg-stat-title">Details</div>
                <div class="form-group">
                  <label class="efg-label">Type</label>
                  <select v-model="f.job_type" class="form-input">
                    <option value="bounty">Bounty</option>
                    <option value="escort">Escort</option>
                    <option value="delivery">Delivery</option>
                    <option value="investigation">Investigation</option>
                    <option value="retrieval">Retrieval</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="efg-label">Difficulty</label>
                  <select v-model="f.difficulty" class="form-input">
                    <option>easy</option><option>medium</option><option>hard</option><option>deadly</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="efg-label">💰 Reward</label>
                  <input v-model="f.reward" class="form-input" placeholder="500gp, favour…" />
                </div>
              </div>
            </div>
            <div class="efg-body">
              <div class="form-group">
                <label class="efg-label">Briefing</label>
                <MarkdownEditor v-model="f.description" :minRows="7" placeholder="Describe the job, its requirements, and any known dangers…" />
              </div>
              <div class="form-group">
                <label class="efg-label">📍 Source Location (Notice Board)</label>
                <EntityLookup v-model="f.source_location_id" :options="data.locations.map(x=>({id:x.id,title:x.title||x.name}))" placeholder="Where is this job posted?" />
              </div>
              <div class="form-group">
                <label class="efg-label">Posted By (NPC)</label>
                <EntityLookup v-model="f.posted_by_npc_id" :options="data.npcs.map(x=>({id:x.id,title:x.title||x.name}))" placeholder="Search NPCs…" />
              </div>
              <div class="efg-gm-notes">
                <div class="efg-gm-hdr"><span class="bst-gm-badge">🔒 GM Only</span><span class="bst-gm-notes-title">Private Notes</span></div>
                <MarkdownEditor v-model="f.gm_notes" :minRows="3" placeholder="True motives, complications, hidden rewards…" />
              </div>
            </div>
          </div>
        </template>

        <!-- Bestiary -->
        <template v-else-if="type === 'bestiary'">
          <!-- ── Header: Portrait + Creature Name ── -->
          <div class="bst-header">
            <div class="bst-portrait-col">
              <Dropzone
                variant="square"
                accept="image/*"
                :value="portraitFile || portraitPreview || null"
                :on-change="handlePortraitChange"
                :on-remove="handlePortraitRemove"
                hint="PNG, JPG"
              />
            </div>
            <div class="bst-name-col">
              <label class="bst-label">Creature Name</label>
              <input v-model="f.name" class="form-input bst-name-input" placeholder="e.g. Ancient Red Dragon…" />
            </div>
          </div>

          <!-- ── Main Body: Stat Block + Description ── -->
          <div class="bst-body">
            <div class="bst-stat-block">
              <div class="bst-stat-title">Stat Block</div>
              <div class="form-group">
                <label class="bst-label">CR</label>
                <input v-model.number="f.cr" class="form-input bst-stat-input" type="number" step="0.25" min="0" placeholder="—" />
              </div>
              <div class="form-group">
                <label class="bst-label">AC</label>
                <input v-model.number="f.ac" class="form-input bst-stat-input" type="number" min="0" placeholder="—" />
              </div>
              <div class="form-group">
                <label class="bst-label">HP</label>
                <input v-model.number="f.hp" class="form-input bst-stat-input" type="number" min="0" placeholder="—" />
              </div>
            </div>
            <div class="bst-desc-col">
              <label class="bst-label">Description</label>
              <textarea v-model="f.description" class="form-input bst-desc-area" rows="7"
                placeholder="Describe this creature's appearance, behaviour, and lore…"></textarea>
            </div>
          </div>

          <!-- ── Player Notes ── -->
          <div class="form-group bst-player-notes">
            <label class="bst-label">Player Notes</label>
            <textarea v-model="f.player_notes" class="form-input" rows="3"
              placeholder="Notes visible to all players in the campaign…"></textarea>
          </div>

          <!-- ── DM Private Notes (GM only) ── -->
          <div class="bst-gm-notes">
            <div class="bst-gm-notes-hdr">
              <span class="bst-gm-badge">🔒 GM Only</span>
              <span class="bst-gm-notes-title">Private Notes</span>
            </div>
            <textarea v-model="f.gm_notes" class="form-input bst-gm-textarea" rows="3"
              placeholder="Secret information, hidden motivations, encounter tactics… not visible to players."></textarea>
          </div>
        </template>

        <!-- Rumour -->
        <template v-else-if="type === 'rumour'">
          <div class="form-group"><label>Rumour Text</label><textarea v-model="f.text" class="form-input" rows="3" placeholder="They say the blacksmith…"></textarea></div>
          <div class="form-group"><label>Source NPC</label><input v-model="f.source_npc" class="form-input" /></div>
          <div class="form-group"><label>Source Location</label><input v-model="f.source_location" class="form-input" /></div>
          <div class="form-group"><label>Is True?</label>
            <select v-model="f.is_true" class="form-input">
              <option :value="true">True</option>
              <option :value="false">False</option>
            </select>
          </div>
        </template>

        <!-- Poll -->
        <template v-else-if="type === 'poll'">
          <div class="form-group"><label>Question</label><input v-model="f.question" class="form-input" placeholder="Which day works best?" /></div>
          <div class="form-group"><label>Options (one per line)</label><textarea v-model="f.options_text" class="form-input" rows="5" placeholder="Saturday evening&#10;Sunday afternoon"></textarea></div>
          <div class="form-group"><label>Results visible to players?</label>
            <select v-model="f.results_public" class="form-input">
              <option :value="0">Hidden until you reveal</option>
              <option :value="1">Visible immediately</option>
            </select>
          </div>
        </template>

        <!-- Schedule -->
        <template v-else-if="type === 'schedule'">
          <div class="form-group"><label>Proposed Date &amp; Time</label><input v-model="f.proposed_date" class="form-input" type="datetime-local" /></div>
          <div class="form-group"><label>Label (optional)</label><input v-model="f.title" class="form-input" placeholder="Session 14 — The Vault…" /></div>
        </template>

        <!-- Agenda -->
        <template v-else-if="type === 'agenda'">
          <div class="form-group"><label>Player</label>
            <select v-model="f.user_id" class="form-input">
              <option value="">Select player…</option>
              <option v-for="u in players" :key="u.id" :value="u.id">{{ u.username }}</option>
            </select>
          </div>
          <div class="form-group"><label>Agenda Title</label><input v-model="f.title" class="form-input" placeholder="Session objective…" /></div>
          <div class="form-group"><label>Body / Details</label><textarea v-model="f.content" class="form-input" rows="5"></textarea></div>
        </template>

        <!-- Message -->
        <template v-else-if="type === 'message'">
          <div class="form-group"><label>To</label>
            <select v-model="f.user_id" class="form-input">
              <option value="">All Players</option>
              <option v-for="u in players" :key="u.id" :value="u.id">{{ u.username }}</option>
            </select>
          </div>
          <div class="form-group"><label>Subject</label><input v-model="f.subject" class="form-input" /></div>
          <div class="form-group"><label>Message</label><textarea v-model="f.content" class="form-input" rows="5"></textarea></div>
        </template>

        <!-- Fallback -->
        <template v-else>
          <div class="empty-state" style="padding:12px">No form for type: {{ type }}</div>
        </template>
      </div>

      <div v-if="saveError" class="status-msg status-err" style="margin-bottom:8px;padding:0 var(--space-6)">{{ saveError }}</div>

      <StickyFormFooter
        :primary-label="isEdit ? 'Save' : 'Create'"
        :on-primary="save"
        :on-cancel="ui.closeGmEdit"
        :is-loading="saving"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import SearchSelect from './SearchSelect.vue'
import EntityLookup from './EntityLookup.vue'
import MarkdownEditor from './MarkdownEditor.vue'
import Dropzone from './Dropzone.vue'
import StickyFormFooter from './StickyFormFooter.vue'
import EntityForm from './EntityForm.vue'

const ui = useUiStore()
const data = useDataStore()
const campaign = useCampaignStore()

const portraitFile = ref(null)     // File object for portrait/image uploads
const questImgFile = ref(null)     // File object for quest banner upload
const saving = ref(false)
const saveError = ref('')
const portraitPreview = ref('')
const mapImgPreview = ref('')
const handoutImgPreview = ref('')

function handlePortraitChange(file) {
  portraitFile.value = file
  portraitPreview.value = URL.createObjectURL(file)
}
function handlePortraitRemove() {
  portraitFile.value = null
  portraitPreview.value = ''
}
function handleQuestImgChange(file) {
  questImgFile.value = file
  f.image_url = ''
}
function handleQuestImgRemove() {
  questImgFile.value = null
  f.image_url = ''
}
function handleHandoutImgChange(file) {
  portraitFile.value = file
  handoutImgPreview.value = URL.createObjectURL(file)
}
function handleHandoutImgRemove() {
  portraitFile.value = null
  handoutImgPreview.value = ''
}
function handleMapImgChange(file) {
  portraitFile.value = file
  mapImgPreview.value = URL.createObjectURL(file)
}
function handleMapImgRemove() {
  portraitFile.value = null
  mapImgPreview.value = ''
}

const f = reactive({
  title: '', name: '', description: '', status: 'active', quest_type: 'main',
  role: '', gm_notes: '', player_notes: '', goals: '', known_members: '', date: '', in_world_date: '',
  linked_quest: '', quantity: 1, holder: 'party', significance: '', reward: '',
  difficulty: 'medium', posted_by: '', location: '', text: '', source_npc: '',
  source_location: '', is_true: true, cr: null, ac: null, hp: null, map_type: 'world',
  content: '', user_id: '', subject: '', question: '', options_text: '',
  results_public: 0, proposed_date: '', subtitle: '',
  // Quest-specific new fields
  reward_gold: '', reward_xp: '', reward_items: '',
  urgency: 'none', deadline: '', connected_location: '', connected_npcs: '',
  parent_quest_id: null,
  // Quest multi-pick arrays (serialised to comma strings on save)
  connected_locations_arr: [],
  connected_factions_arr: [],
  connected_npcs_arr: [],
  image_url: '',
  // NPC
  race: '', disposition: '', faction_id: null, home_location_id: null,
  // Location
  danger_level: 0, location_type: '', parent_location_id: null,
  // Faction
  standing: 0, influence: 3, leader_npc_id: null, hq_location_id: null, member_ids: [],
  // Job
  source_location_id: null, posted_by_npc_id: null, job_type: 'bounty',
  // Timeline
  significance: 'minor', involved_npc_ids: [], involved_faction_ids: [],
  // Map-specific
  map_gm_only: false, map_connected_to: [], map_linked_location_id: null,
})

const type = computed(() => ui.gmEditModal?.type || '')
const isEdit = computed(() => !!ui.gmEditModal?.id)
const title = computed(() => {
  const t = type.value
  const cap = t.charAt(0).toUpperCase() + t.slice(1)
  return isEdit.value ? `Edit ${cap}` : `Create ${cap}`
})

const MIGRATED_TYPES = new Set(['quest'])
const isMigratedType = computed(() => MIGRATED_TYPES.has(type.value))
const modalMaxWidth = computed(() => {
  if (isMigratedType.value) return '720px'
  if (['bestiary','npc','location','faction','job','timeline','map'].includes(type.value)) return '700px'
  return '520px'
})

const players = computed(() => data.users.filter(u => u.role !== 'gm'))

const TYPE_ENDPOINT = {
  quest: '/api/quests', npc: '/api/npcs', location: '/api/locations',
  hook: '/api/hooks', handout: '/api/handouts', map: '/api/maps',
  session: '/api/sessions', faction: '/api/factions', timeline: '/api/timeline',
  inventory: '/api/inventory', 'key-item': '/api/key-items', job: '/api/jobs',
  bestiary: '/api/bestiary', rumour: '/api/rumours', agenda: '/api/agenda',
  poll: '/api/sessions/polls', schedule: '/api/sessions/scheduling', message: '/api/messages',
}

const TYPE_RELOAD = {
  quest: () => data.loadQuests(), npc: () => data.loadNpcs(),
  location: () => data.loadLocations(), hook: () => data.loadHooks(),
  faction: () => data.loadFactions(), timeline: () => data.loadTimeline(),
  inventory: () => data.loadInventory(), 'key-item': () => data.loadInventory(),
  job: () => data.loadJobs(), bestiary: () => data.loadBestiary(),
  rumour: () => data.loadRumours(), map: () => data.loadMaps(),
  handout: () => data.loadHandouts(), session: () => data.loadSessions(),
  poll: () => data.loadSessions(), schedule: () => data.loadSessions(),
  agenda: () => data.loadAgenda(), message: () => data.loadMessages(),
  notes: () => data.loadNotes(),
}

// Prefill form when editing
watch(() => ui.gmEditModal, (modal) => {
  if (!modal) return
  // Reset
  Object.keys(f).forEach(k => {
    if (Array.isArray(f[k])) f[k] = []
    else if (typeof f[k] === 'number') f[k] = 0
    else if (typeof f[k] === 'boolean') f[k] = false
    else f[k] = ''
  })
  portraitFile.value = null
  questImgFile.value = null
  portraitPreview.value = ''
  mapImgPreview.value = ''
  handoutImgPreview.value = ''
  f.status = 'active'; f.quest_type = 'main'; f.difficulty = 'medium'
  f.quantity = 1; f.holder = 'party'; f.map_type = 'world'; f.is_true = true
  f.results_public = 0
  if (!modal.data) return
  const d = modal.data
  f.title = d.title || ''
  f.name = d.name || d.title || ''
  f.description = d.description || ''
  f.status = d.status || 'active'
  f.quest_type = d.quest_type || d.type || 'main'
  f.role = d.role || ''
  f.gm_notes = d.gm_notes || ''
  f.goals = d.goals || ''
  f.known_members = d.known_members || ''
  f.date = d.session_date || d.in_world_date || ''
  f.in_world_date = d.in_world_date || ''
  f.linked_quest = d.linked_quest || ''
  f.quantity = d.quantity || 1
  f.holder = d.holder || 'party'
  f.significance = d.significance || ''
  f.reward = d.reward || ''
  f.difficulty = d.difficulty || 'medium'
  f.posted_by = d.posted_by || ''
  f.location = d.location || d.source_location || ''
  f.text = d.text || ''
  f.source_npc = d.source_npc || ''
  f.source_location = d.source_location || ''
  f.is_true = d.is_true !== undefined ? d.is_true : true
  // Quest new fields
  f.reward_gold = d.reward_gold || ''
  f.reward_xp = d.reward_xp || ''
  f.reward_items = d.reward_items || ''
  f.urgency = d.urgency || 'none'
  f.deadline = d.deadline || ''
  f.connected_location = d.connected_location || ''
  f.connected_npcs = d.connected_npcs || ''
  f.parent_quest_id = d.parent_quest_id || null
  // Prefill multi-pick arrays — support both old singular and new plural fields
  const splitC = (s) => s ? s.split(',').map(x => x.trim()).filter(Boolean) : []
  const locNames = splitC(d.connected_locations || d.connected_location || '')
  f.connected_locations_arr = locNames
  f.connected_factions_arr = splitC(d.connected_factions || '')
  f.connected_npcs_arr = splitC(d.connected_npcs || '')
  f.image_url = d.image_url || ''
  f.cr = d.stats?.cr ?? null
  f.ac = d.stats?.ac ?? null
  f.hp = d.stats?.hp ?? null
  f.player_notes = d.player_notes || ''
  if (['bestiary','npc','location','faction'].includes(modal.type)) portraitPreview.value = d.image_path || d.image_url || ''
  if (modal.type === 'map' && d.image_path) mapImgPreview.value = '/uploads/' + d.image_path
  if (modal.type === 'handout' && d.file_path) handoutImgPreview.value = '/uploads/' + d.file_path
  // NPC
  f.race = d.race || ''
  f.disposition = d.disposition || ''
  f.faction_id = d.faction_id || null
  f.home_location_id = d.home_location_id || null
  // Location
  f.danger_level = d.danger_level || 0
  f.location_type = d.location_type || ''
  f.parent_location_id = d.parent_location_id || null
  // Faction
  f.standing = d.standing || 0
  f.influence = d.influence || 3
  f.leader_npc_id = d.leader_npc_id || null
  f.hq_location_id = d.hq_location_id || null
  f.member_ids = (d.members || []).map(m => m.id)
  // Job
  f.source_location_id = d.source_location_id || null
  f.posted_by_npc_id = d.posted_by_npc_id || null
  f.job_type = d.job_type || 'bounty'
  // Timeline
  f.significance = d.significance || 'minor'
  f.involved_npc_ids = []
  f.involved_faction_ids = []
  f.map_type = d.map_type || 'world'
  // Map-specific
  f.map_gm_only = !!(d.hidden)
  f.map_linked_location_id = d.linked_location_id || null
  try { f.map_connected_to = d.connected_to ? JSON.parse(d.connected_to) : [] } catch { f.map_connected_to = [] }
  f.content = d.body || d.content || ''
  f.subject = d.subject || ''
  f.user_id = d.to_user_id || d.user_id || ''
  if (type.value === 'session') {
    f.date = d.played_at ? d.played_at.slice(0, 10) : ''
  }
}, { immediate: true })

async function uploadQuestImage() {
  const file = questImgFile.value
  if (!file) return null
  const fd = new FormData()
  fd.append('file', file)
  const token = localStorage.getItem('chronicle_token')
  const r = await fetch('/api/uploads', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
  if (r.ok) { const d = await r.json(); return d.url || d.path || null }
  return null
}

async function uploadImage() {
  const file = portraitFile.value
  if (!file) return null
  const fd = new FormData()
  fd.append('file', file)
  const token = localStorage.getItem('chronicle_token')
  const r = await fetch('/api/uploads', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
  if (r.ok) { const d = await r.json(); return d.url || d.path || null }
  return null
}

async function save() {
  saving.value = true
  saveError.value = ''
  try {
    const t = type.value
    let imageUrl = null
    if (portraitFile.value) imageUrl = await uploadImage()

    const endpoint = TYPE_ENDPOINT[t]
    if (!endpoint) throw new Error('Unknown type')

    let body = {}
    switch (t) {
      case 'quest': {
        const questImgUrl = questImgFile.value
          ? await uploadQuestImage()
          : (f.image_url || null)
        body = {
          title: f.title, description: f.description, status: f.status, quest_type: f.quest_type,
          parent_quest_id: f.parent_quest_id || null,
          reward_gold: f.reward_gold || null, reward_xp: f.reward_xp || null, reward_items: f.reward_items || null,
          urgency: f.urgency || 'none', deadline: f.deadline || null, gm_notes: f.gm_notes || null,
          connected_locations: f.connected_locations_arr.join(',') || null,
          connected_factions: f.connected_factions_arr.join(',') || null,
          connected_npcs: f.connected_npcs_arr.join(',') || null,
          image_url: questImgUrl,
        }; break
      }
      case 'npc':
        body = { name: f.name, role: f.role, description: f.description, gm_notes: f.gm_notes,
                 player_notes: f.player_notes, race: f.race, disposition: f.disposition,
                 faction_id: f.faction_id || null, home_location_id: f.home_location_id || null }
        if (imageUrl) body.image_url = imageUrl
        break
      case 'location':
        body = { name: f.name, description: f.description, danger_level: f.danger_level,
                 location_type: f.location_type || null, parent_location_id: f.parent_location_id || null,
                 gm_notes: f.gm_notes, player_notes: f.player_notes }
        if (imageUrl) body.image_url = imageUrl
        break
      case 'hook':
        body = { title: f.title, description: f.description, status: f.status }; break
      case 'handout':
        body = { title: f.title, body: f.content, file_path: imageUrl || null, file_type: imageUrl ? 'image' : 'markdown', share_with: f.user_id ? [Number(f.user_id)] : [] }; break
      case 'session':
        body = { title: f.title, summary: f.description, session_date: f.date }; break
      case 'map':
        body = {
          title: f.title, description: f.description, map_type: f.map_type,
          gm_notes: f.gm_notes || null,
          linked_location_id: f.map_linked_location_id || null,
          connected_to: f.map_connected_to.length ? JSON.stringify(f.map_connected_to) : null,
          hidden: f.map_gm_only ? 1 : 0,
        }
        if (imageUrl) body.image_path = imageUrl
        else if (!isEdit.value) throw new Error('Map image is required')
        break
      case 'faction':
        body = { name: f.name, description: f.description, goals: f.goals,
                 standing: f.standing, influence: f.influence,
                 leader_npc_id: f.leader_npc_id || null, hq_location_id: f.hq_location_id || null,
                 gm_notes: f.gm_notes, member_ids: f.member_ids }
        if (imageUrl) body.image_path = imageUrl
        break
      case 'timeline':
        body = { title: f.title, description: f.description, in_world_date: f.in_world_date,
                 linked_quest: f.linked_quest || null, significance: f.significance }; break
      case 'inventory':
        body = { name: f.name, quantity: f.quantity || 1, holder: f.holder || 'party', description: f.description }; break
      case 'key-item':
        body = { name: f.name, description: f.description, significance: f.significance, linked_quest: f.linked_quest || null, image_path: imageUrl }; break
      case 'job':
        body = { title: f.title, description: f.description, reward: f.reward,
                 difficulty: f.difficulty || 'medium', job_type: f.job_type || 'bounty',
                 source_location_id: f.source_location_id || null,
                 posted_by: f.posted_by || null, posted_by_npc_id: f.posted_by_npc_id || null,
                 gm_notes: f.gm_notes }; break
      case 'bestiary':
        body = { name: f.name, description: f.description, stats: { cr: f.cr, ac: f.ac, hp: f.hp }, player_notes: f.player_notes, gm_notes: f.gm_notes, image_path: imageUrl }; break
      case 'rumour':
        body = { text: f.text, source_npc: f.source_npc, source_location: f.source_location, is_true: f.is_true }; break
      case 'agenda':
        if (!f.user_id) throw new Error('Select a player')
        body = { user_id: f.user_id, title: f.title, body: f.content }; break
      case 'poll': {
        const opts = (f.options_text || '').split('\n').map(o => o.trim()).filter(Boolean)
        if (!opts.length) throw new Error('Add at least one option')
        body = { question: f.question, options: opts, results_public: Number(f.results_public || 0) }; break
      }
      case 'schedule':
        body = { proposed_date: f.proposed_date, title: f.title || undefined }; break
      case 'message':
        body = { to_user_id: f.user_id ? Number(f.user_id) : null, subject: f.subject || 'Message', body: f.content }; break
      default:
        throw new Error(`Unknown type: ${t}`)
    }

    const id = ui.gmEditModal.id
    const url = isEdit.value ? `${endpoint}/${id}` : endpoint
    const method = isEdit.value ? 'PUT' : 'POST'
    const r = await data.apif(url, { method, body: JSON.stringify(body) })
    if (!r.ok) {
      const d = await r.json().catch(() => ({}))
      throw new Error(d.error || 'Save failed')
    }

    ui.showToast(`${t.charAt(0).toUpperCase() + t.slice(1)} ${isEdit.value ? 'updated' : 'created'}`, '', '✓')
    TYPE_RELOAD[t]?.()
    ui.closeGmEdit()
  } catch (e) {
    saveError.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>

/* ── Quest banner image preview ─────────────────────────────────────────── */
.quest-img-preview {
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.quest-img-preview img {
  width: 100%;
  max-height: 120px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--border);
}

/* ── GM-only section label ───────────────────────────────────────────────── */
.gm-section-label {
  color: var(--red, #c94c4c) !important;
  border-bottom-color: rgba(201, 76, 76, 0.3) !important;
}
.gm-notes-group {
  background: rgba(180, 40, 40, 0.05);
  border: 1px solid rgba(201, 76, 76, 0.22);
  border-radius: 4px;
  padding: 10px;
}
.gm-notes-group label { color: var(--red, #c94c4c); }

/* ── Bestiary Form ───────────────────────────────────────────────────────── */
.bst-label {
  display: block;
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: .06em;
  color: var(--text3);
  margin-bottom: 5px;
}

/* Header row: portrait left, name right */
.bst-header {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 18px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.bst-portrait-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.bst-avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 2px solid var(--border2);
  background: var(--bg3) center/cover no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color .2s;
}
.bst-avatar:hover { border-color: var(--gold); }
.bst-avatar-icon { font-size: 34px; opacity: .5; }

.bst-upload-btn {
  font-size: 10px;
  letter-spacing: .04em;
  padding: 4px 10px;
  cursor: pointer;
  white-space: nowrap;
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: 4px;
  color: var(--text2);
  transition: border-color .15s, color .15s;
}
.bst-upload-btn:hover { border-color: var(--gold); color: var(--gold2); }

.bst-name-col { display: flex; flex-direction: column; justify-content: center; }

.bst-name-input {
  font-family: 'Cinzel', serif !important;
  font-size: 20px !important;
  font-weight: 600;
  color: var(--text) !important;
  letter-spacing: .03em;
  height: 52px;
  padding: 0 14px;
}
.bst-name-input:focus { border-color: var(--gold) !important; box-shadow: 0 0 0 2px rgba(201,168,76,.18); }

/* Main body: stat block left, description right */
.bst-body {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 18px;
  margin-bottom: 14px;
}

.bst-stat-block {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bst-stat-title {
  font-family: 'Cinzel', serif;
  font-size: 10px;
  color: var(--gold);
  letter-spacing: .08em;
  text-transform: uppercase;
  margin-bottom: 2px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 6px;
}

.bst-stat-input {
  text-align: center;
  font-family: 'JetBrains Mono', monospace !important;
  font-size: 16px !important;
  font-weight: 700;
  color: var(--gold2) !important;
  padding: 6px 8px;
  height: auto;
}
.bst-stat-input:focus { border-color: var(--gold) !important; }

.bst-desc-col { display: flex; flex-direction: column; }

.bst-desc-area {
  flex: 1;
  resize: vertical;
  min-height: 160px;
  line-height: 1.65;
}

/* Player notes */
.bst-player-notes { margin-bottom: 4px; }

/* DM Private Notes */
.bst-gm-notes {
  background: rgba(180, 40, 40, .07);
  border: 1px solid rgba(201, 76, 76, .35);
  border-radius: 6px;
  padding: 14px;
  margin-top: 8px;
}

.bst-gm-notes-hdr {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.bst-gm-badge {
  font-size: 9px;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: .06em;
  color: var(--red);
  background: rgba(201, 76, 76, .14);
  border: 1px solid rgba(201, 76, 76, .35);
  padding: 2px 8px;
  border-radius: 3px;
}

.bst-gm-notes-title {
  font-family: 'Cinzel', serif;
  font-size: 12px;
  color: var(--red);
  letter-spacing: .05em;
}

.bst-gm-textarea { resize: vertical; }
.bst-gm-textarea:focus { border-color: var(--red) !important; box-shadow: 0 0 0 2px rgba(201, 76, 76, .15); }

/* Tablet/mobile: stack header and body vertically */
@media (max-width: 560px) {
  .bst-header { grid-template-columns: 1fr; }
  .bst-portrait-col { flex-direction: row; gap: 12px; align-items: center; }
  .bst-body { grid-template-columns: 1fr; }
  .bst-stat-block { flex-direction: row; flex-wrap: wrap; gap: 12px; }
  .bst-stat-block .form-group { flex: 1; min-width: 60px; }
}

/* ── Entity Form 30/70 Grid ──────────────────────────────────────────────── */
.entity-form-grid {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 20px;
  margin-top: 8px;
}

.efg-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.efg-portrait-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.efg-portrait {
  width: 100%;
  height: 180px;
  border-radius: 8px;
  border: 2px solid var(--border2);
  background: var(--bg3) center/contain no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color .2s;
}
.efg-portrait:hover { border-color: var(--accent); }
.efg-portrait--map { border-radius: 4px; }
.efg-portrait-icon { font-size: 36px; opacity: .45; }

.efg-upload-btn {
  font-size: 10px;
  padding: 4px 10px;
  cursor: pointer;
  white-space: nowrap;
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: 4px;
  color: var(--text2);
  transition: border-color .15s, color .15s;
}
.efg-upload-btn:hover { border-color: var(--accent); color: var(--text); }

.efg-stat-block {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 0;
}

.efg-stat-title {
  font-family: 'Cinzel', serif;
  font-size: 10px;
  color: var(--accent, var(--gold));
  letter-spacing: .08em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--border);
  padding-bottom: 6px;
  margin-bottom: 2px;
}

.efg-label {
  display: block;
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: .06em;
  color: var(--text3);
  margin-bottom: 5px;
}

.efg-stat-input {
  text-align: center;
  font-family: 'JetBrains Mono', monospace !important;
  font-size: 15px !important;
  font-weight: 700;
  padding: 6px 8px;
  height: auto;
}

.efg-body {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.efg-body > .form-group { margin-bottom: 10px; }

.efg-gm-notes {
  background: rgba(180, 40, 40, .07);
  border: 1px solid rgba(201, 76, 76, .35);
  border-radius: 6px;
  padding: 12px 14px;
  margin-top: 4px;
}

.efg-gm-hdr {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

@media (max-width: 600px) {
  .entity-form-grid { grid-template-columns: 1fr; }
  .efg-portrait-wrap { flex-direction: row; justify-content: flex-start; }
  .efg-portrait { width: 100%; height: 120px; }
}
</style>
