import { STATUS_TEXT } from '../constants'
import { SVG_NAMESPACE, XHTML_NAMESPACE, type CacheOption } from './common'
import type { Context } from 'hono'

/** SVG テキスト描画の等幅フォント。generic monospace は環境によって全角:半角=2:1 でないフォント（Osaka等）に解決されるため明示する */
export const DEFAULT_MONOSPACE = 'Menlo, Consolas, monospace'

export type ViewOptions = CacheOption & {
  attrs?: string
}

/** テキストを XML/SVG に埋め込める形にエスケープする */
export function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
}

function textToCh(text: string): number {
  let total = 0
  for (const ch of text) total += (ch.codePointAt(0) ?? 0) > 0xff ? 1.85 : 1
  return total
}

function textToSize(text: string): { width: string; height: string } {
  const lines = text.split('\n')
  const maxUnits = Math.max(...lines.map(textToCh))
  return {
    width: `${maxUnits}ch`,
    height: `${(lines.length * 12) / 10}em`,
  }
}

/** 任意の SVG コンテンツを画像として返す（view チャンネルの本流） */
export function viewResponse(
  c: Context<{ Bindings: Env }>,
  width: number | string,
  height: number | string,
  content: string,
  { attrs = '', cacheControl = 'no-store' }: ViewOptions = {},
): Response {
  c.header('content-type', 'image/svg+xml')
  c.header('cache-control', cacheControl)
  return c.body(`<svg xmlns="${SVG_NAMESPACE}" width="${width}" height="${height}"${attrs ? ` ${attrs}` : ''}>${content}</svg>`)
}

/** HTML を foreignObject の root div で包み、SVG 画像として返す（viewResponse の特殊版） */
export function viewHtmlResponse(
  c: Context<{ Bindings: Env }>,
  width: number | string,
  height: number | string,
  html: string,
  { cacheControl = 'no-store' }: CacheOption = {},
): Response {
  const content = `<foreignObject width="100%" height="100%"><div xmlns="${XHTML_NAMESPACE}" root="">${html}</div></foreignObject>`
  return viewResponse(c, width, height, content, { cacheControl })
}

/** プレーンテキストを monospace のテキスト画像として返す（viewResponse の特殊版） */
export function viewTextResponse(c: Context<{ Bindings: Env }>, text: string, { cacheControl = 'no-store' }: CacheOption = {}): Response {
  const { width, height } = textToSize(text)
  const tspans = escapeXml(text)
    .split('\n')
    .map((line, i) => `<tspan x="0" dy="${i === 0 ? '1em' : '1.2em'}">${line || ' '}</tspan>`)
    .join('')
  return viewResponse(c, width, height, `<text x="0">${tspans}</text>`, { attrs: `font-family="${DEFAULT_MONOSPACE}"`, cacheControl })
}

export function errorResponse(c: Context<{ Bindings: Env }>, errorCode: number, { cacheControl = 'no-store' }: CacheOption = {}): Response {
  return viewTextResponse(c, `${errorCode} ${STATUS_TEXT[errorCode]}`, { cacheControl })
}
