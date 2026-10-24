const escapeHTML = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

const inlineHTML = (value) => escapeHTML(value)
  .replace(/!\[([^\]]*)\]\((?:[^()]|\([^()]*\))*\)/g, '$1')
  .replace(/\[([^\]]+)\]\((?:[^()]|\([^()]*\))*\)/g, '$1')
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/__(.+?)__/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>')
  .replace(/_(.+?)_/g, '<em>$1</em>')
  .replace(/~~(.+?)~~/g, '<s>$1</s>')

/** Render product Markdown as safe, compact HTML for Google Merchant descriptions. */
export function merchantDescription(markdown) {
  const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n')
  const blocks = []
  let paragraph = []
  let list = []

  const flushParagraph = () => {
    if (!paragraph.length) return
    blocks.push(`<div>${paragraph.map(inlineHTML).join('<br>')}</div>`)
    paragraph = []
  }
  const flushList = () => {
    if (!list.length) return
    blocks.push(`<div>${list.map((item) => `• ${inlineHTML(item)}`).join('<br>')}</div>`)
    list = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flushParagraph()
      flushList()
    } else if (/^\s{0,3}#{1,6}\s+/.test(line)) {
      flushParagraph()
      flushList()
      blocks.push(`<div><strong>${inlineHTML(trimmed.replace(/^#{1,6}\s+/, ''))}</strong></div>`)
    } else if (/^\s{0,3}(?:[-*+]\s+|\d+[.)]\s+)/.test(line)) {
      flushParagraph()
      list.push(line.replace(/^\s{0,3}(?:[-*+]\s+|\d+[.)]\s+)/, ''))
    } else if (/^\s{0,3}(?:---+|___+|\*\*\*+)\s*$/.test(line)) {
      flushParagraph()
      flushList()
      blocks.push('<br>')
    } else {
      flushList()
      paragraph.push(trimmed)
    }
  }
  flushParagraph()
  flushList()

  return blocks.join('').replaceAll(']]>', ']]]]><![CDATA[>')
}
