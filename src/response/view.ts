import { STATUS_TEXT } from '../constants'
import type { Context } from 'hono'

/** テキストを XML/SVG に埋め込める形にエスケープする */
export function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
}

function textToCh(text: string): number {
  let total = 0
  for (const ch of text) total += (ch.codePointAt(0) ?? 0) > 0xff ? 1.6 : 1
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
  attrs = '',
  cacheControl = 'no-store',
): Response {
  c.header('content-type', 'image/svg+xml')
  c.header('cache-control', cacheControl)
  return c.body(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}${attrs ? ` ${attrs}` : ''}">${content}</svg>`)
}

/** HTML を foreignObject の root div で包み、SVG 画像として返す（viewResponse の特殊版） */
export function viewHtmlResponse(
  c: Context<{ Bindings: Env }>,
  width: number | string,
  height: number | string,
  html: string,
  cacheControl = 'no-store',
): Response {
  const content = `<foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" root>${html}</div></foreignObject>`
  return viewResponse(c, width, height, content, '', cacheControl)
}

/** プレーンテキストを monospace のテキスト画像として返す（viewResponse の特殊版） */
export function viewTextResponse(c: Context<{ Bindings: Env }>, text: string, cacheControl = 'no-store'): Response {
  const { width, height } = textToSize(text)
  const tspans = escapeXml(text)
    .split('\n')
    .map((line, i) => `<tspan x="0" dy="${i === 0 ? '1em' : '1.2em'}">${line || ' '}</tspan>`)
    .join('')
  return viewResponse(c, width, height, `<text x="0">${tspans}</text>`, 'font-family="monospace"', cacheControl)
}

export function errorResponse(c: Context<{ Bindings: Env }>, errorCode: number, cacheControl = 'no-store'): Response {
  return viewTextResponse(c, `${errorCode} ${STATUS_TEXT[errorCode]}`, cacheControl)
}
