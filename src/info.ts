import { Hono } from 'hono'
import { HOUR, MINUTE, VALUE_MAX } from './constants'
import { getTimezone, getNowParts } from './datetime'
import { infoResponse, clockResponse } from './response'

export const info = new Hono<{ Bindings: Env }>()
const infoDatetime = new Hono<{ Bindings: Env }>()

infoDatetime.get('/clock', (c) => {
  const now = new Date()
  const nowParts = getNowParts(now, getTimezone(c))
  return clockResponse(c, nowParts.hour, nowParts.minute, nowParts.second, 200)
})

infoDatetime.get('/current-time', (c) => {
  const now = new Date()
  const nowParts = getNowParts(now, getTimezone(c))
  const value = nowParts.hour * HOUR + nowParts.minute * MINUTE + nowParts.second
  return infoResponse(c, value, 200)
})

infoDatetime.get('/current-date', (c) => {
  const now = new Date()
  const nowParts = getNowParts(now, getTimezone(c))
  const value = nowParts.year * 372 + (nowParts.month - 1) * 31 + (nowParts.date - 1)
  return infoResponse(c, value, 200)
})

infoDatetime.get('/current-day', (c) => {
  const now = new Date()
  const nowParts = getNowParts(now, getTimezone(c))
  return infoResponse(c, nowParts.day, 200)
})

info.route('/datetime', infoDatetime)

info.get('/online-count', async (c) => {
  const online = await c.env.PRESENCE.getByName('global').peek(Date.now())
  return infoResponse(c, online, 200)
})

info.get('/random', (c) => {
  const fromRaw = c.req.query('from')
  const toRaw = c.req.query('to')
  const from = fromRaw === undefined ? 0 : Math.round(Number(fromRaw))
  const to = toRaw === undefined ? VALUE_MAX : Math.round(Number(toRaw))
  if (Number.isNaN(from) || Number.isNaN(to) || from > to || from < 0 || to > VALUE_MAX) {
    return infoResponse(c, 0, 400)
  }
  const value = Math.floor(Math.random() * (to - from + 1)) + from
  return infoResponse(c, value, 200)
})
