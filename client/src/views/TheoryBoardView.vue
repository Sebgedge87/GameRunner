<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">Theory Board</div><div class="page-sub">Your investigation canvas</div></div>
    <div class="theory-wrap">
      <svg ref="svgEl" id="theory-svg"></svg>
      <div class="theory-panel">
        <div class="theory-panel-box">
          <div class="theory-panel-title">ADD NODE</div>
          <div class="field-group"><label>Label</label><input v-model="form.label" type="text" /></div>
          <div class="field-group"><label>Type</label>
            <select v-model="form.type">
              <option value="theory">Theory</option>
              <option value="fact">Fact</option>
              <option value="npc">NPC</option>
              <option value="location">Location</option>
              <option value="question">Question</option>
            </select>
          </div>
          <div class="field-group"><label>Notes</label><textarea v-model="form.notes" style="min-height:55px"></textarea></div>
          <button class="submit-btn" @click="addNode">ADD</button>
          <div v-if="addStatus" :class="['status-msg', addOk ? 'status-ok' : 'status-err']">{{ addStatus }}</div>
        </div>

        <!-- Edit box -->
        <div v-if="selectedNode" class="theory-panel-box">
          <div class="theory-panel-title">EDIT NODE</div>
          <div class="field-group"><label>Label</label><input v-model="editForm.label" type="text" /></div>
          <div class="field-group"><label>Notes</label><textarea v-model="editForm.notes" style="min-height:55px"></textarea></div>
          <div class="field-group" style="display:flex;align-items:center;gap:8px">
            <input type="checkbox" v-model="editForm.shared" id="theory-shared" style="width:14px;height:14px;cursor:pointer" />
            <label for="theory-shared" style="margin:0;cursor:pointer;font-size:12px;color:var(--text2)">Share with GM</label>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
            <button class="btn btn-sm" @click="saveNode">Save</button>
            <button class="btn btn-sm btn-danger" @click="deleteNode">Delete</button>
            <button class="btn btn-sm" @click="startLinkMode" v-if="!linkMode">Link →</button>
            <button class="btn btn-sm btn-danger" @click="linkMode = false" v-if="linkMode">Cancel Link</button>
          </div>
          <div v-if="linkMode" style="font-size:11px;color:var(--accent);margin-top:6px">Click another node to link it</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useUiStore } from '@/stores/ui'

const data = useDataStore()
const ui = useUiStore()

const svgEl = ref(null)
let d3 = null
let simulation = null

const form = reactive({ label: '', type: 'theory', notes: '' })
const editForm = reactive({ label: '', notes: '', shared: false })
const addStatus = ref('')
const addOk = ref(false)
const selectedNode = ref(null)
const linkMode = ref(false)
let boardData = { nodes: [], links: [] }

const TYPE_COLORS = {
  theory: '#c9a84c', fact: '#4caf7d', npc: '#4c7ac9',
  location: '#4caf7d', question: '#8b4cc9',
}

async function loadBoard() {
  try {
    const r = await data.apif('/api/theory')
    if (r.ok) {
      const d = await r.json()
      boardData.nodes = d.nodes || []
      boardData.links = d.links || []
      renderBoard()
    }
  } catch (e) { console.error('[loadBoard]', e) }
}

async function addNode() {
  if (!form.label) { addStatus.value = 'Label required.'; addOk.value = false; return }
  const r = await data.apif('/api/theory/nodes', {
    method: 'POST',
    body: JSON.stringify({ label: form.label, type: form.type, notes: form.notes }),
  })
  if (r.ok) {
    addStatus.value = 'Added.'
    addOk.value = true
    form.label = ''
    form.notes = ''
    await loadBoard()
  } else {
    addStatus.value = 'Failed.'
    addOk.value = false
  }
}

async function saveNode() {
  if (!selectedNode.value) return
  const r = await data.apif(`/api/theory/nodes/${selectedNode.value.id}`, {
    method: 'PUT',
    body: JSON.stringify({ label: editForm.label, notes: editForm.notes, shared: editForm.shared }),
  })
  if (r.ok) { await loadBoard(); ui.showToast('Node updated', '', '✓') }
}

async function deleteNode() {
  if (!selectedNode.value || !confirm('Delete node?')) return
  const r = await data.apif(`/api/theory/nodes/${selectedNode.value.id}`, { method: 'DELETE' })
  if (r.ok) { selectedNode.value = null; await loadBoard() }
}

function startLinkMode() {
  linkMode.value = true
}

function renderBoard() {
  if (!svgEl.value || !d3) return
  if (simulation) simulation.stop()

  const svg = d3.select(svgEl.value)
  svg.selectAll('*').remove()

  const { nodes, links } = boardData
  if (!nodes.length) return

  const width = svgEl.value.clientWidth || 700
  const height = svgEl.value.clientHeight || 500

  svg.attr('viewBox', `0 0 ${width} ${height}`)

  // Work with a copy for d3
  const nodesData = nodes.map(n => ({ ...n }))
  const nodesById = Object.fromEntries(nodesData.map(n => [n.id, n]))
  const linksData = links.map(l => ({
    source: nodesById[l.source_id],
    target: nodesById[l.target_id],
  })).filter(l => l.source && l.target)

  simulation = d3.forceSimulation(nodesData)
    .force('link', d3.forceLink(linksData).distance(100))
    .force('charge', d3.forceManyBody().strength(-150))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide(30))

  const link = svg.append('g').selectAll('line').data(linksData).join('line')
    .attr('stroke', 'var(--border2)').attr('stroke-width', 1.5)

  const node = svg.append('g').selectAll('circle').data(nodesData).join('circle')
    .attr('r', 14)
    .attr('fill', d => TYPE_COLORS[d.type] || '#888')
    .attr('stroke', d => selectedNode.value?.id === d.id ? 'white' : 'transparent')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('click', async (_, d) => {
      if (linkMode.value && selectedNode.value && selectedNode.value.id !== d.id) {
        // Create link
        await data.apif('/api/theory/links', {
          method: 'POST',
          body: JSON.stringify({ source_id: selectedNode.value.id, target_id: d.id }),
        })
        linkMode.value = false
        await loadBoard()
        return
      }
      selectedNode.value = d
      editForm.label = d.label
      editForm.notes = d.notes || ''
      editForm.shared = !!d.shared_with_gm
    })
    .call(d3.drag()
      .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y })
      .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null })
    )

  const label = svg.append('g').selectAll('text').data(nodesData).join('text')
    .text(d => d.label.length > 12 ? d.label.slice(0, 10) + '…' : d.label)
    .attr('font-size', '9px')
    .attr('fill', 'var(--text)')
    .attr('text-anchor', 'middle')
    .attr('dy', '4px')
    .style('pointer-events', 'none')

  simulation.on('tick', () => {
    link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
    node.attr('cx', d => d.x).attr('cy', d => d.y)
    label.attr('x', d => d.x).attr('y', d => d.y)
  })
}

onMounted(async () => {
  if (typeof window.d3 === 'undefined') {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js'
    script.onload = () => { d3 = window.d3; loadBoard() }
    document.head.appendChild(script)
  } else {
    d3 = window.d3
    await loadBoard()
  }
})

onUnmounted(() => {
  if (simulation) simulation.stop()
})
</script>
