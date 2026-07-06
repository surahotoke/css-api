import { Hono } from 'hono'
import { HOUR, MINUTE } from '../constants'
import { getTimezone, getNowParts } from './common'
import { infoResponse, clockResponse } from '../response/info'

export const info = new Hono<{ Bindings: Env }>()

info.get('/clock', (c) => {
  const now = new Date()
  const nowParts = getNowParts(now, getTimezone(c))
  return clockResponse(c, nowParts.hour, nowParts.minute, nowParts.second)
})

info.get('/current-time', (c) => {
  const now = new Date()
  const nowParts = getNowParts(now, getTimezone(c))
  const value = nowParts.hour * HOUR + nowParts.minute * MINUTE + nowParts.second
  return infoResponse(c, value)
})

info.get('/current-date', (c) => {
  const now = new Date()
  const nowParts = getNowParts(now, getTimezone(c))
  const value = nowParts.year * 372 + (nowParts.month - 1) * 31 + (nowParts.date - 1)
  return infoResponse(c, value)
})

info.get('/current-day', (c) => {
  const now = new Date()
  const nowParts = getNowParts(now, getTimezone(c))
  return infoResponse(c, nowParts.day)
})
