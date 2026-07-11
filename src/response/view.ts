import { STATUS_TEXT } from '../constants'
import type { Context } from 'hono'

function textToCh(text: string): number {
  let total = 0
  for (const ch of text) total += (ch.codePointAt(0) ?? 0) > 0xff ? 2 : 1
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

export function viewTextResponse(c: Context<{ Bindings: Env }>, text: string, cacheControl = 'no-store'): Response {
  const { width, height } = textToSize(text)
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const tspans = escaped
    .split('\n')
    .map((line, i) => `<tspan x="0" dy="${i === 0 ? '1em' : '1.2em'}">${line || ' '}</tspan>`)
    .join('')
  c.header('content-type', 'image/svg+xml')
  c.header('cache-control', cacheControl)
  return c.body(
    `<svg xmlns="http://www.w3.org/2000/svg" font-family="monospace" width="${width}" height="${height}"><text x="0">${tspans}</text></svg>`,
  )
}

export function errorResponse(c: Context<{ Bindings: Env }>, errorCode: number, cacheControl = 'no-store'): Response {
  return viewTextResponse(c, `${errorCode} ${STATUS_TEXT[errorCode]}`, cacheControl)
}
