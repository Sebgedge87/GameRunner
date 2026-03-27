<template>
  <div v-if="ui.activeFlyout === 'handout'" class="modal-overlay open" style="z-index:250" @click.self="close">
    <div v-if="handout" class="modal">
      <div class="modal-title">{{ handout.title }}</div>
      <div v-if="handout.shared_at" class="modal-from">Shared: {{ fmt(handout.shared_at) }}</div>
      <img v-if="handout.file_type === 'image' && handout.file_path"
        class="modal-img"
        :src="handout.file_path"
        alt="" />
      <div v-else-if="handout.body" class="modal-body prose" v-html="renderMd(handout.body)"></div>
      <div v-else class="modal-body" style="color:var(--text3);font-style:italic">No content.</div>
      <div class="modal-actions">
        <button class="modal-close" @click="close">Close</button>
        <button v-if="handout.file_path" class="btn btn-sm" @click="downloadFile">
          Download
        </button>
        <button v-if="handout.requires_ack && !handout.acked_at" class="btn btn-primary btn-sm" @click="ack">
          Acknowledge
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import { useUiStore } from '@/stores/ui'
import { useDataStore } from '@/stores/data'

const ui = useUiStore()
const data = useDataStore()

const handout = computed(() => ui.viewingHandout || null)

function renderMd(text) { return marked.parse(text || '', { breaks: true }) }

function fmt(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function close() {
  ui.closeHandout()
}

async function ack() {
  if (!handout.value) return
  const r = await data.apif(`/api/handouts/${handout.value.id}/ack`, { method: 'PUT' })
  if (r.ok) {
    handout.value.acked_at = new Date().toISOString()
    await data.loadHandouts()
  }
}

async function downloadFile() {
  if (!handout.value?.file_path) return
  const r = await data.apif(`/api/handouts/${handout.value.id}/file`)
  if (!r.ok) return
  const blob = await r.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = handout.value.title || 'handout'
  a.click()
  URL.revokeObjectURL(url)
}
</script>
