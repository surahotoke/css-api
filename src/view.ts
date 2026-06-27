import { Hono } from 'hono'
import { WEEKDAYS } from './constants'
import { getTimezone, getFmtLocale, getNowParts, shiftDate, buildDateOptions } from './datetime'
import { viewTextResponse, errorResponse } from './response'

export const view = new Hono<{ Bindings: Env }>()
const viewDatetime = new Hono<{ Bindings: Env }>()

viewDatetime.get('/now', (c) => {
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
    if (raw !== undefined && Number.isNaN(Number(raw))) return errorResponse(c, 400)
  }

  const dayRaw = c.req.query('day')
  if (dayRaw !== undefined && !WEEKDAYS.includes(dayRaw)) return errorResponse(c, 400)

  const showRaw = c.req.query('show')
  const show = showRaw === undefined ? ['year', 'month', 'date', 'hour', 'minute'] : showRaw.split(',').map((s) => s.trim())
  const VALID_FIELDS = ['year', 'month', 'date', 'day', 'hour', 'minute', 'second']
  if (show.some((f) => !VALID_FIELDS.includes(f))) return errorResponse(c, 400)

  const digit = c.req.query('pad') !== undefined ? '2-digit' : 'numeric'
  const options = buildDateOptions(show, digit)

  const fmtDate = shiftDate(c, nowParts)
  const text = new Intl.DateTimeFormat(getFmtLocale(c), options).format(fmtDate)
  return viewTextResponse(c, text)
})

view.route('/datetime', viewDatetime)
