import { Hono } from 'hono'
import { LIMIT_VALUE, ERROR_CODE } from '../constants'
import { infoResponse, errorResponse } from '../response/info'

export const info = new Hono<{ Bindings: Env }>()

info.get('/', (c) => {
  const fromRaw = c.req.query('from')
  const toRaw = c.req.query('to')
  const from = fromRaw === undefined ? 0 : Math.round(Number(fromRaw))
  const to = toRaw === undefined ? LIMIT_VALUE : Math.round(Number(toRaw))
  if (Number.isNaN(from) || Number.isNaN(to) || from > to || from < -LIMIT_VALUE || to > LIMIT_VALUE) {
    return errorResponse(c, ERROR_CODE.BAD_REQUEST)
  }
  const value = Math.floor(Math.random() * (to - from + 1)) + from
  return infoResponse(c, value)
})
