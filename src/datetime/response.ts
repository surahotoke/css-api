import { BASE, MINUTE, HOUR, DAY, SUCCESS_CODE } from '../constants'
import { infoResponse } from '../response/info'
import type { Context } from 'hono'

/** 現在時刻を info 値として返し、SVG 内で animate して時計のように進める */
export function infoClockResponse(
  c: Context<{ Bindings: Env }>,
  hour: number,
  minute: number,
  second: number,
  status: number = SUCCESS_CODE.OK,
): Response {
  const minuteSecond = minute * MINUTE + second
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
  return infoResponse(c, hour * BASE + minuteSecond, status, widthAnim + heightAnim)
}
