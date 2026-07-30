import { LIMIT_VALUE, MINUTE, HOUR, DAY } from '../constants'
import { infoResponse } from '../response/info'
import type { Context } from 'hono'

/** 現在時刻を info 値として返し、SVG 内で animate して時計のように進める */
export function infoClockResponse(c: Context<{ Bindings: Env }>, hour: number, minute: number, second: number): Response {
  const daySecond = hour * HOUR + minute * MINUTE + second
  const widthAnim =
    `<animate id="t" attributeName="width" from="${daySecond + LIMIT_VALUE}" to="${DAY + LIMIT_VALUE}" dur="${DAY - daySecond}s"/>` +
    `<animate attributeName="width" from="${LIMIT_VALUE}" to="${DAY + LIMIT_VALUE}" dur="${DAY}s" begin="t.end" repeatCount="indefinite"/>`
  return infoResponse(c, daySecond, { content: widthAnim })
}
