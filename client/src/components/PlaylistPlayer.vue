<template>
  <div v-if="embed" class="playlist-wrap" style="margin-bottom:14px">
    <iframe
      v-if="embed.type === 'spotify'"
      :src="embed.embedUrl"
      height="80"
      allow="autoplay;clipboard-write;encrypted-media;fullscreen;picture-in-picture"
      loading="lazy"
    ></iframe>
    <iframe
      v-else-if="embed.type === 'youtube'"
      :src="embed.embedUrl"
      height="200"
      allow="autoplay;encrypted-media"
      allowfullscreen
      loading="lazy"
    ></iframe>
    <div v-else-if="embed.type === 'youtube-music' || embed.type === 'link'" class="playlist-link-bar">
      ♪ <a :href="url" target="_blank" rel="noopener">Open Playlist ↗</a>
      <span style="color:var(--text3);font-size:10px">
        {{ embed.type === 'youtube-music' ? '(YouTube Music — opens in new tab)' : '(opens in new tab)' }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ url: String })

const embed = computed(() => {
  if (!props.url) return null
  try {
    const u = new URL(props.url)
    if (u.hostname === 'open.spotify.com') {
      const parts = u.pathname.split('/').filter(Boolean)
      if (parts.length >= 2) return { type: 'spotify', embedUrl: `https://open.spotify.com/embed/${parts[0]}/${parts[1]}?utm_source=generator` }
    }
    if (u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') {
      const list = u.searchParams.get('list')
      if (list) return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(list)}` }
      const v = u.searchParams.get('v')
      if (v) return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${v}` }
    }
    if (u.hostname === 'youtu.be') {
      return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${u.pathname.slice(1)}` }
    }
    if (u.hostname === 'music.youtube.com') return { type: 'youtube-music', embedUrl: null }
    return { type: 'link', embedUrl: null }
  } catch { return null }
})
</script>
