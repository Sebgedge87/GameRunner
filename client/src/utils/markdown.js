import { marked } from 'marked'

marked.use({ breaks: true })

/**
 * Render markdown to HTML. Use with v-html.
 */
export function renderMd(text) {
  if (!text) return ''
  return marked.parse(String(text))
}

/**
 * Strip markdown syntax for plain-text card previews.
 * Returns a truncated string with no markdown tokens.
 */
export function stripMd(text, maxLen = 120) {
  if (!text) return ''
  const plain = String(text)
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
  return plain.length > maxLen ? plain.slice(0, maxLen) + '…' : plain
}
