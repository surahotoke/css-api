import { Hono } from 'hono'
import { HOUR, MINUTE } from '../constants'
import { getTimezone, getNowFields } from './common'
import { infoResponse, clockResponse } from '../response/info'

export const info = new Hono<{ Bindings: Env }>()

info.get('/clock', (c) => {
  const now = new Date()
  const nowFields = getNowFields(now, getTimezone(c))
  return clockResponse(c, nowFields.hour, nowFields.minute, nowFields.second)
})

info.get('/current-time', (c) => {
  const now = new Date()
  const nowFields = getNowFields(now, getTimezone(c))
  const value = nowFields.hour * HOUR + nowFields.minute * MINUTE + nowFields.second
  return infoResponse(c, value)
})

info.get('/current-date', (c) => {
  const now = new Date()
  const nowFields = getNowFields(now, getTimezone(c))
  const value = nowFields.year * 372 + (nowFields.month - 1) * 31 + (nowFields.date - 1)
  return infoResponse(c, value)
})

info.get('/current-day', (c) => {
  const now = new Date()
  const nowFields = getNowFields(now, getTimezone(c))
  return infoResponse(c, nowFields.day)
})
