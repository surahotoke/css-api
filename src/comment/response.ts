import { viewResponse, escapeXml } from '../response/view'
import type { Context } from 'hono'

export type CommentRow = { name: string; comment: string; createdAt: string }

const WIDTH = 380
const PADDING = 12
const CONTENT_WIDTH = WIDTH - PADDING * 2
const BODY_FONT_SIZE = 14
const LINE_HEIGHT = Math.round(BODY_FONT_SIZE * 1.5)
const DATETIME_FONT_SIZE = 11
const BLOCK_PADDING_Y = 10
const BORDER_WIDTH = 1

/** 折り返し見積もりの1行あたり容量。全角=2units・半角=1.2units、1unit=0.5em */
const LINE_CAPACITY = Math.floor(CONTENT_WIDTH / (BODY_FONT_SIZE * 0.5))

const STYLE =
  `div.list{font-family:system-ui,sans-serif;padding:0 ${PADDING}px;color:#333}` +
  `div.item{padding:${BLOCK_PADDING_Y}px 0;border-top:${BORDER_WIDTH}px solid #ddd}` +
  `div.item:first-child{border-top:none}` +
  `div.head{display:flex;justify-content:space-between;align-items:baseline;line-height:${LINE_HEIGHT}px}` +
  `span.name{font-weight:bold;color:#222;font-size:${BODY_FONT_SIZE}px}` +
  `span.dt{color:#999;font-size:${DATETIME_FONT_SIZE}px;white-space:nowrap}` +
  `p.body{margin:0;font-size:${BODY_FONT_SIZE}px;line-height:${LINE_HEIGHT}px;white-space:pre-wrap;overflow-wrap:anywhere}` +
  `p.empty{margin:0;padding:${BLOCK_PADDING_Y}px 0;font-size:${BODY_FONT_SIZE}px;line-height:${LINE_HEIGHT}px;color:#999;text-align:center}`

function textToUnits(text: string): number {
  let total = 0
  for (const ch of text) total += (ch.codePointAt(0) ?? 0) > 0xff ? 2 : 1.2
  return total
}

function estimateLines(text: string): number {
  return text.split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(textToUnits(line) / LINE_CAPACITY)), 0)
}

/** コメント一覧を、デザインされた SVG（foreignObject）画像で返す */
export function viewListResponse(c: Context<{ Bindings: Env }>, rows: CommentRow[], cacheControl = 'no-store'): Response {
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
  const content =
    `<foreignObject width="100%" height="100%">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" class="list"><style>${STYLE}</style>${inner}</div>` +
    `</foreignObject>`
  return viewResponse(c, WIDTH, height, content, '', cacheControl)
}
