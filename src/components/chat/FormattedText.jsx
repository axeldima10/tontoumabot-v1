import { memo, useMemo } from 'react'

// Expressions hoistées : elles sont réutilisées à chaque rendu d'un message en flux.
const FENCE = /^```/
const BULLET = /^\s*[-*•]\s+/
const NUMBERED = /^\s*(\d+)[.)]\s+/
const HEADING = /^#{1,4}\s+/
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s)<>]+)/g

/**
 * Découpe une réponse texte en blocs simples (paragraphes, listes, titres, code).
 * Aucun HTML n'est injecté : tout est rendu en éléments React, donc sans risque XSS.
 */
function parseBlocks(text) {
  const blocks = []
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  let paragraph = []
  let list = null

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'p', text: paragraph.join('\n') })
    paragraph = []
  }
  const flushList = () => {
    if (list) blocks.push(list)
    list = null
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]

    if (FENCE.test(line)) {
      flushParagraph()
      flushList()
      const code = []
      index += 1
      // Un bloc non fermé (réponse encore en flux) prend simplement le reste du texte.
      while (index < lines.length && !FENCE.test(lines[index])) {
        code.push(lines[index])
        index += 1
      }
      blocks.push({ type: 'code', text: code.join('\n') })
      continue
    }

    if (!line.trim()) {
      flushParagraph()
      flushList()
      continue
    }

    const numbered = line.match(NUMBERED)
    if (BULLET.test(line) || numbered) {
      flushParagraph()
      const type = numbered ? 'ol' : 'ul'
      if (list?.type !== type) {
        flushList()
        list = { type, start: numbered ? Number(numbered[1]) : 1, items: [] }
      }
      list.items.push(line.replace(numbered ? NUMBERED : BULLET, ''))
      continue
    }

    if (HEADING.test(line)) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'h', text: line.replace(HEADING, '') })
      continue
    }

    flushList()
    paragraph.push(line)
  }

  flushParagraph()
  flushList()
  return blocks
}

function renderInline(text) {
  return text.split(INLINE).map((part, index) => {
    if (!part) return null
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>
    if (part.startsWith('http')) {
      return <a key={index} href={part} target="_blank" rel="noopener noreferrer">{part}</a>
    }
    return part
  })
}

function FormattedText({ text }) {
  const blocks = useMemo(() => parseBlocks(text), [text])

  return (
    <div className="rich-text">
      {blocks.map((block, index) => {
        if (block.type === 'code') return <pre key={index}><code>{block.text}</code></pre>
        if (block.type === 'h') return <p key={index} className="rich-heading">{renderInline(block.text)}</p>
        if (block.type === 'ul') return <ul key={index}>{block.items.map((item, i) => <li key={i}>{renderInline(item)}</li>)}</ul>
        if (block.type === 'ol') return <ol key={index} start={block.start}>{block.items.map((item, i) => <li key={i}>{renderInline(item)}</li>)}</ol>
        return <p key={index}>{renderInline(block.text)}</p>
      })}
    </div>
  )
}

export default memo(FormattedText)
