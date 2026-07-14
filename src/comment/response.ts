import { viewHtmlResponse, escapeXml } from '../response/view'
import { WIDTH, CONTENT_WIDTH, BODY_FONT_SIZE, LINE_HEIGHT, BLOCK_PADDING_Y, BORDER_WIDTH, STYLE } from './style.css'
import type { Context } from 'hono'

export type CommentRow = { name: string; comment: string; createdAt: string }

/** 折り返し見積もりの1行あたり容量。全角=2.1units・半角=1.2units、1unit=0.5em */
const LINE_CAPACITY = Math.floor(CONTENT_WIDTH / (BODY_FONT_SIZE * 0.5))

function textToUnits(text: string): number {
  let total = 0
  for (const ch of text) total += (ch.codePointAt(0) ?? 0) > 0xff ? 2.1 : 1.2
  return total
}

function estimateLines(text: string): number {
  return text.split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(textToUnits(line) / LINE_CAPACITY)), 0)
}

/** コメント一覧を、デザインされた SVG（foreignObject）画像で返す */
export function viewCommentResponse(c: Context<{ Bindings: Env }>, rows: CommentRow[], cacheControl = 'no-store'): Response {
  let height = 0
  let inner: string
  if (rows.length === 0) {
    height = BLOCK_PADDING_Y * 2 + LINE_HEIGHT
    inner = `<p class="empty">まだコメントはありません</p>`
  } else {
    inner = rows
      .map((row, i) => {
        height += (i === 0 ? 0 : BORDER_WIDTH) + BLOCK_PADDING_Y * 2 + LINE_HEIGHT * (1 + estimateLines(row.comment))
        return (
          `<div class="item">` +
          `<div class="head"><span class="name">${escapeXml(row.name)}</span><span class="dt">${escapeXml(row.createdAt)}</span></div>` +
          `<p class="body">${escapeXml(row.comment)}</p>` +
          `</div>`
        )
      })
      .join('')
  }
  return viewHtmlResponse(c, WIDTH, height, `<style>${STYLE}</style>${inner}`, cacheControl)
}
