<template>
  <div v-if="ui.activeFlyout === 'handout'" class="modal-overlay open" style="z-index:250" @click.self="close">
    <div v-if="handout" class="modal">
      <div class="modal-title">{{ handout.title }}</div>
      <div class="modal-from">
        Type: {{ handout.file_type || 'text' }}{{ handout.shared_at ? ' · Shared: ' + fmt(handout.shared_at) : '' }}
      </div>
      <img v-if="handout.file_type === 'image' && handout.file_path"
        class="modal-img"
        :src="handout.file_path"
        alt="" />
      <div v-else class="modal-body">{{ handout.body || '' }}</div>
      <div class="modal-actions">
        <button class="modal-close" @click="close">CLOSE</button>
        <button v-if="handout.requires_ack && !handout.acked_at" class="btn btn-primary btn-sm" @click="ack">
          Acknowledge
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useDataStore } from '@/stores/data'

const ui = useUiStore()
const data = useDataStore()

const handout = computed(() => ui._viewingHandout || null)

function fmt(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function close() {
  ui._viewingHandout = null
  ui.closeFlyout()
}

async function ack() {
  if (!handout.value) return
  const r = await data.apif(`/api/handouts/${handout.value.id}/ack`, { method: 'POST' })
  if (r.ok) {
    handout.value.acked_at = new Date().toISOString()
    await data.loadHandouts()
  }
}
</script>
