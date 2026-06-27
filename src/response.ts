import type { Context } from 'hono'
import { BASE, STATUS_TEXT, MINUTE, HOUR, DAY } from './constants'

function dataToSvgSize(value: number, status: number): { width: number; height: number } {
  return {
    width: value % BASE,
    height: 900 * Math.floor(value / BASE) + status - 100,
  }
}

export function infoResponse(c: Context<{ Bindings: Env }>, value: number, status: number, cacheControl = 'no-store'): Response {
  const { width, height } = dataToSvgSize(value, status)
  c.header('content-type', 'image/svg+xml')
  c.header('cache-control', cacheControl)
  return c.body(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"></svg>`)
}

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
    .map((line, i) => `<tspan x="0" dy="${i === 0 ? '1em' : '1.2em'}">${line}</tspan>`)
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

export function clockResponse(c: Context<{ Bindings: Env }>, hour: number, minute: number, second: number, status: number): Response {
  const minuteSecond = minute * MINUTE + second
  const width = minuteSecond
  const height = hour * 900 + (status - 100)
  const widthAnim =
    `<animate id="t" attributeName="width" from="${minuteSecond}" to="${HOUR}" dur="${HOUR - minuteSecond}s"/>` +
    `<animate attributeName="width" from="0" to="${HOUR}" dur="${HOUR}s" begin="t.end" repeatCount="indefinite"/>`
  const values: number[] = []
  const keyTimes: number[] = []
  for (let i = 0; i < 25; i++) {
    const h = (hour + i) % 24
    values.push(h * 900 + (status - 100))
    const boundary = i === 0 ? 0 : (HOUR - minuteSecond + (i - 1) * HOUR) / DAY
    keyTimes.push(boundary)
  }
  const heightAnim =
    `<animate attributeName="height" calcMode="discrete" ` +
    `values="${values.join(';')}" keyTimes="${keyTimes.join(';')}" ` +
    `dur="${DAY}s" repeatCount="indefinite"/>`
  c.header('content-type', 'image/svg+xml')
  c.header('cache-control', 'no-store')
  return c.body(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${widthAnim}${heightAnim}</svg>`)
}
