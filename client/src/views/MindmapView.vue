<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">Mindmap</div><div class="page-sub">Connection graph — drag to explore</div></div>
    <div class="mindmap-legend">
      <div class="legend-item"><div class="legend-dot" style="background:#c9a84c"></div>Quest</div>
      <div class="legend-item"><div class="legend-dot" style="background:#4c7ac9"></div>NPC</div>
      <div class="legend-item"><div class="legend-dot" style="background:#4caf7d"></div>Location</div>
      <div class="legend-item"><div class="legend-dot" style="background:#8b4cc9"></div>Hook</div>
      <div class="legend-item"><div class="legend-dot" style="background:#c94c4c"></div>Map</div>
      <div class="legend-item"><div class="legend-dot" style="background:#c94c8b"></div>Faction</div>
    </div>
    <div style="position:relative">
      <svg ref="svgEl" id="mindmap-svg" style="height:500px;width:100%"></svg>
      <div v-if="flyoutItem" id="mindmap-flyout" style="position:absolute;top:12px;right:12px;width:230px;background:var(--surface);border:1px solid var(--border2);border-radius:8px;padding:14px;z-index:10;box-shadow:0 8px 24px var(--color-shadow-menu)">
        <div style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:6px">{{ flyoutItem.type.toUpperCase() }}</div>
        <div style="font-size:15px;color:var(--text);margin-bottom:6px;font-family:'Cinzel',serif">{{ flyoutItem.title }}</div>
        <div v-if="flyoutItem.description" style="font-size:12px;color:var(--text2);line-height:1.5">{{ flyoutItem.description.slice(0, 120) }}{{ flyoutItem.description.length > 120 ? '…' : '' }}</div>
        <button class="btn btn-sm" style="margin-top:8px" @click="flyoutItem = null">✕ Close</button>
      </div>
    </div>
    <div style="margin-top:8px;font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace">
      Click a node to inspect · Connections auto-generated from item links
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'
import { useDataStore } from '@/stores/data'

const data = useDataStore()
const svgEl = ref(null)
const flyoutItem = ref(null)
let simulation = null

const TYPE_COLORS = {
  quest: '#c9a84c', npc: '#4c7ac9', location: '#4caf7d', hook: '#8b4cc9', map: '#c94c4c', faction: '#c94c8b',
}

function buildGraphData() {
  const nodes = []
  const edgeSet = new Set()
  const links = []
  // title-based lookup (all types merged)
  const titleMap = new Map()
  // per-type ID lookup: idMap['npc'].get('42') → node
  const idMap = { quest: new Map(), npc: new Map(), location: new Map(), hook: new Map(), map: new Map(), faction: new Map() }

  const addNode = (item, type) => {
    const title = item.title || item.name || '?'
    const node = { id: `${type}-${item.id}`, title, type, description: item.description || '' }
    nodes.push(node)
    titleMap.set(title.toLowerCase(), node)
    idMap[type].set(String(item.id), node)
    return node
  }

  data.quests.forEach(q => addNode(q, 'quest'))
  data.npcs.forEach(n => addNode({ ...n, title: n.title || n.name }, 'npc'))
  data.locations.forEach(l => addNode({ ...l, title: l.title || l.name }, 'location'))
  data.hooks.forEach(h => addNode(h, 'hook'))
  data.maps.forEach(m => addNode(m, 'map'))
  data.factions.forEach(f => addNode({ ...f, title: f.name }, 'faction'))

  function addLink(src, tgt) {
    if (!src || !tgt || src.id === tgt.id) return
    const key = src.id < tgt.id ? `${src.id}|${tgt.id}` : `${tgt.id}|${src.id}`
    if (edgeSet.has(key)) return
    edgeSet.add(key)
    links.push({ source: src.id, target: tgt.id })
  }

  // resolve by ID first, fall back to title
  function resolve(type, idOrTitle) {
    if (!idOrTitle) return null
    const s = String(idOrTitle).trim()
    return idMap[type]?.get(s) || titleMap.get(s.toLowerCase()) || null
  }

  function splitRef(val) {
    if (!val) return []
    if (Array.isArray(val)) return val.map(String)
    return String(val).split(',').map(s => s.trim()).filter(Boolean)
  }

  // ── Quests ───────────────────────────────────────────────────────────────
  data.quests.forEach(q => {
    const qNode = idMap.quest.get(String(q.id))
    // parent quest chain
    if (q.parent_quest_id) addLink(qNode, idMap.quest.get(String(q.parent_quest_id)))
    // legacy single location text field
    if (q.location) addLink(qNode, titleMap.get(q.location.toLowerCase()))
    // connected_locations (IDs or titles)
    splitRef(q.connected_locations || q.connected_location).forEach(v => addLink(qNode, resolve('location', v)))
    // connected_npcs
    splitRef(q.connected_npcs).forEach(v => addLink(qNode, resolve('npc', v)))
    // connected_factions
    splitRef(q.connected_factions).forEach(v => addLink(qNode, resolve('faction', v)))
    // legacy connected_to
    splitRef(q.connected_to).forEach(v => addLink(qNode, titleMap.get(v.toLowerCase())))
  })

  // ── NPCs ─────────────────────────────────────────────────────────────────
  data.npcs.forEach(n => {
    const nNode = idMap.npc.get(String(n.id))
    if (n.faction_id)       addLink(nNode, idMap.faction.get(String(n.faction_id)))
    if (n.home_location_id) addLink(nNode, idMap.location.get(String(n.home_location_id)))
    // legacy text location
    if (n.location) addLink(nNode, titleMap.get(n.location.toLowerCase()))
    splitRef(n.connected_to).forEach(v => addLink(nNode, titleMap.get(v.toLowerCase())))
  })

  // ── Factions ─────────────────────────────────────────────────────────────
  data.factions.forEach(f => {
    const fNode = idMap.faction.get(String(f.id))
    if (f.leader_npc_id)  addLink(fNode, idMap.npc.get(String(f.leader_npc_id)))
    if (f.hq_location_id) addLink(fNode, idMap.location.get(String(f.hq_location_id)))
    // faction members (enriched by server)
    if (Array.isArray(f.members)) {
      f.members.forEach(m => addLink(fNode, idMap.npc.get(String(m.id))))
    }
  })

  // ── Locations ────────────────────────────────────────────────────────────
  data.locations.forEach(l => {
    if (l.parent_location_id) {
      addLink(idMap.location.get(String(l.id)), idMap.location.get(String(l.parent_location_id)))
    }
  })

  // ── Maps ─────────────────────────────────────────────────────────────────
  data.maps.forEach(m => {
    const mNode = idMap.map.get(String(m.id))
    if (m.linked_location_id) addLink(mNode, idMap.location.get(String(m.linked_location_id)))
    let conn = []
    try { conn = m.connected_to ? JSON.parse(m.connected_to) : [] } catch { conn = [] }
    conn.forEach(c => addLink(mNode, titleMap.get(String(c).toLowerCase())))
  })

  // ── Hooks ─────────────────────────────────────────────────────────────────
  data.hooks.forEach(h => {
    const hNode = idMap.hook.get(String(h.id))
    splitRef(h.connected_to).forEach(v => addLink(hNode, titleMap.get(v.toLowerCase())))
  })

  return { nodes, links }
}

async function renderMindmap() {
  if (!svgEl.value) return

  if (simulation) simulation.stop()
  const svg = d3.select(svgEl.value)
  svg.selectAll('*').remove()

  const { nodes, links } = buildGraphData()
  if (!nodes.length) return

  const width = svgEl.value.clientWidth || 800
  const height = 500

  svg.attr('viewBox', `0 0 ${width} ${height}`)

  // Zoomable/pannable container
  const container = svg.append('g')

  const zoom = d3.zoom()
    .scaleExtent([0.2, 4])
    .on('zoom', (event) => { container.attr('transform', event.transform) })

  svg.call(zoom).on('dblclick.zoom', null)

  simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(80))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide(25))

  const link = container.append('g')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke', 'var(--border2)')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', 1.5)

  const nodeDrag = d3.drag()
    .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
    .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
    .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null })

  const node = container.append('g')
    .selectAll('circle')
    .data(nodes)
    .join('circle')
    .attr('r', 10)
    .attr('fill', d => TYPE_COLORS[d.type] || '#888')
    .attr('stroke', d => TYPE_COLORS[d.type] || '#888')
    .attr('stroke-opacity', 0.4)
    .attr('stroke-width', 6)
    .style('cursor', 'pointer')
    .on('click', (_, d) => { flyoutItem.value = d })
    .call(nodeDrag)

  const label = container.append('g')
    .selectAll('text')
    .data(nodes)
    .join('text')
    .text(d => d.title.length > 16 ? d.title.slice(0, 14) + '…' : d.title)
    .attr('font-size', '9px')
    .attr('fill', 'var(--text2)')
    .attr('text-anchor', 'middle')
    .attr('dy', '22px')
    .style('pointer-events', 'none')

  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
    node
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
    label
      .attr('x', d => d.x)
      .attr('y', d => d.y)
  })
}

onMounted(async () => {
  if (!data.quests.length || !data.maps.length || !data.factions.length) await data.loadAll()
  renderMindmap()
})

onUnmounted(() => {
  if (simulation) simulation.stop()
})

watch([() => data.quests, () => data.npcs, () => data.locations, () => data.hooks, () => data.maps, () => data.factions], renderMindmap)
</script>
