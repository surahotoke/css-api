import { BASE, MINUTE, HOUR, DAY, SUCCESS_CODE } from '../constants'
import type { Context } from 'hono'

function dataToSvgSize(value: number, status: number): { width: number; height: number } {
  return {
    width: value % BASE,
    height: 900 * Math.floor(value / BASE) + status - 100,
  }
}

export function infoResponse(
  c: Context<{ Bindings: Env }>,
  value: number,
  status: number = SUCCESS_CODE.OK,
  cacheControl = 'no-store',
): Response {
  const { width, height } = dataToSvgSize(value, status)
  c.header('content-type', 'image/svg+xml')
  c.header('cache-control', cacheControl)
  return c.body(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"></svg>`)
}

export function clockResponse(
  c: Context<{ Bindings: Env }>,
  hour: number,
  minute: number,
  second: number,
  status: number = SUCCESS_CODE.OK,
): Response {
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

export function errorResponse(c: Context<{ Bindings: Env }>, errorCode: number, cacheControl = 'no-store'): Response {
  return infoResponse(c, 0, errorCode, cacheControl)
}
