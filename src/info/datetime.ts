import { Hono } from 'hono'
import { HOUR, MINUTE } from '../constants'
import { getTimezone, getNowParts } from '../datetime'
import { infoResponse, clockResponse } from './response'

export const datetime = new Hono<{ Bindings: Env }>()

datetime.get('/clock', (c) => {
  const now = new Date()
  const nowParts = getNowParts(now, getTimezone(c))
  return clockResponse(c, nowParts.hour, nowParts.minute, nowParts.second)
})

datetime.get('/current-time', (c) => {
  const now = new Date()
  const nowParts = getNowParts(now, getTimezone(c))
  const value = nowParts.hour * HOUR + nowParts.minute * MINUTE + nowParts.second
  return infoResponse(c, value)
})

datetime.get('/current-date', (c) => {
  const now = new Date()
  const nowParts = getNowParts(now, getTimezone(c))
  const value = nowParts.year * 372 + (nowParts.month - 1) * 31 + (nowParts.date - 1)
  return infoResponse(c, value)
})

datetime.get('/current-day', (c) => {
  const now = new Date()
  const nowParts = getNowParts(now, getTimezone(c))
  return infoResponse(c, nowParts.day)
})
