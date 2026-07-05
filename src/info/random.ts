import { Hono } from 'hono'
import { VALUE_MAX, ERROR_CODE } from '../constants'
import { infoResponse, errorResponse } from './response'

export const random = new Hono<{ Bindings: Env }>()

random.get('/', (c) => {
  const fromRaw = c.req.query('from')
  const toRaw = c.req.query('to')
  const from = fromRaw === undefined ? 0 : Math.round(Number(fromRaw))
  const to = toRaw === undefined ? VALUE_MAX : Math.round(Number(toRaw))
  if (Number.isNaN(from) || Number.isNaN(to) || from > to || from < 0 || to > VALUE_MAX) {
    return errorResponse(c, ERROR_CODE.BAD_REQUEST)
  }
  const value = Math.floor(Math.random() * (to - from + 1)) + from
  return infoResponse(c, value)
})
