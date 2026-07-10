import { Hono } from 'hono'
import { WEEKDAYS, ERROR_CODE } from '../constants'
import { getTimezone, getLocale, getNowParts, shiftDate, buildDateOptions } from './common'
import { viewTextResponse, errorResponse } from '../response/view'

export const view = new Hono<{ Bindings: Env }>()

view.get('/now', (c) => {
  const now = new Date()
  const nowParts = getNowParts(now, getTimezone(c))

  // --- validate ---
  const NUM_PARAMS = [
    'year',
    'month',
    'week',
    'date',
    'hour',
    'minute',
    'second',
    'addyear',
    'addmonth',
    'addweek',
    'adddate',
    'addhour',
    'addminute',
    'addsecond',
  ]
  for (const name of NUM_PARAMS) {
    const raw = c.req.query(name)
    if (raw !== undefined && Number.isNaN(Number(raw))) return errorResponse(c, ERROR_CODE.BAD_REQUEST)
  }

  const dayRaw = c.req.query('day')
  if (dayRaw !== undefined && !WEEKDAYS.includes(dayRaw)) return errorResponse(c, ERROR_CODE.BAD_REQUEST)

  const showRaw = c.req.query('show')
  const show = showRaw === undefined ? ['year', 'month', 'date', 'hour', 'minute'] : showRaw.split(',').map((s) => s.trim())
  const VALID_FIELDS = ['year', 'month', 'date', 'day', 'hour', 'minute', 'second']

  if (show.includes('all')) show.splice(0, show.length, ...VALID_FIELDS)
  else if (show.some((f) => !VALID_FIELDS.includes(f))) return errorResponse(c, ERROR_CODE.BAD_REQUEST)

  const digit = c.req.query('pad') !== undefined ? '2-digit' : 'numeric'
  const options = buildDateOptions(show, digit)

  const shiftedDate = shiftDate(c, nowParts)
  const text = new Intl.DateTimeFormat(getLocale(c), options).format(shiftedDate)
  return viewTextResponse(c, text)
})
