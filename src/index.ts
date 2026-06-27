import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { DurableObject, waitUntil } from 'cloudflare:workers'
import { Kysely, sql } from 'kysely'
import { D1Dialect } from 'kysely-d1'
import type { Context } from 'hono'

const DEFAULT_TIMEZONE = 'Asia/Tokyo'
const DEFAULT_LOCALE = 'ja-JP'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const BASE = 316781
const VALUE_MAX = 999999

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

const SECOND_MS = 1000
const MINUTE_MS = MINUTE * SECOND_MS
const HOUR_MS = HOUR * SECOND_MS
const DAY_MS = DAY * SECOND_MS
const WEEK_MS = WEEK * SECOND_MS

const app = new Hono<{ Bindings: Env }>()
const cookie = new Hono<{ Bindings: Env }>()

const info = new Hono<{ Bindings: Env }>()
const infoDatetime = new Hono<{ Bindings: Env }>()

const view = new Hono<{ Bindings: Env }>()
const viewDatetime = new Hono<{ Bindings: Env }>()

const COOKIE_OPT = { sameSite: 'None', secure: true, maxAge: 34560000, path: '/' } as const

const STATUS_TEXT: Record<number, string> = {
  100: 'Continue',
  101: 'Switching Protocols',
  102: 'Processing',
  103: 'Early Hints',
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non-Authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',
  207: 'Multi-Status',
  208: 'Already Reported',
  226: 'IM Used',
  300: 'Multiple Choices',
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  304: 'Not Modified',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Content Too Large',
  414: 'URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  421: 'Misdirected Request',
  422: 'Unprocessable Content',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Too Early',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  451: 'Unavailable For Legal Reasons',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  511: 'Network Authentication Required',
}

app.get('/', async (c) => {
  c.header('content-type', 'image/svg+xml')
  c.header('cache-control', 'no-store')
  return c.body('<svg xmlns="http://www.w3.org/2000/svg" width="123" height="456"></svg>')
})

cookie.get('/get/:name', (c) => {
  const name = c.req.param('name')
  const raw = getCookie(c, name)
  let value = 0
  let status: number
  if (raw === undefined) {
    status = 404
  } else {
    const n = Math.round(Number(raw))
    if (Number.isNaN(n) || n < 0 || n > VALUE_MAX) {
      status = 404
    } else {
      value = n
      status = 200
    }
  }
  return infoResponse(c, value, status)
})

cookie.get('/set/:name', (c) => {
  const name = c.req.param('name')
  setCookie(c, name, c.req.query('value') ?? '', COOKIE_OPT)
  return infoResponse(c, 0, 200)
})

cookie.get('/delete/:name', (c) => {
  const name = c.req.param('name')
  deleteCookie(c, name, COOKIE_OPT)
  return infoResponse(c, 0, 200)
})

app.route('/cookie', cookie)

app.get('/heartbeat', async (c) => {
  let uuid = getCookie(c, 'uuid')
  if (!uuid) {
    uuid = crypto.randomUUID()
    setCookie(c, 'uuid', uuid, COOKIE_OPT)
  }
  const online = await c.env.PRESENCE.getByName('global').heartbeat(uuid, Date.now())
  c.header('content-type', 'image/svg+xml')
  c.header('cache-control', 'no-store')
  return c.body(`<svg xmlns="http://www.w3.org/2000/svg" width="10ch" height="1.2em"><text x="0" y="1em">Online: ${online}</text></svg>`)
})

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

app.route('/info', info)

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
  //

  const digit = c.req.query('pad') !== undefined ? '2-digit' : 'numeric'
  const options = buildDateOptions(show, digit)

  const fmtDate = shiftDate(c, nowParts)
  const text = new Intl.DateTimeFormat(getFmtLocale(c), options).format(fmtDate)
  return viewTextResponse(c, text)
})

view.route('/datetime', viewDatetime)
app.route('/view', view)

function getTimezone(c: Context<{ Bindings: Env }>): string {
  return (c.req.raw.cf?.timezone as string) ?? DEFAULT_TIMEZONE
}

function getFmtLocale(c: Context<{ Bindings: Env }>): string {
  return c.req.query('fmt') || c.req.header('Accept-Language')?.split(',')[0]?.trim() || DEFAULT_LOCALE
}

function getNowParts(date: Date, timezone: string = DEFAULT_TIMEZONE) {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: timezone }).format(date)
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const part = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0)
  return {
    year: part('year'),
    month: part('month'),
    date: part('day'),
    day: (new Date(today).getUTCDay() + 6) % 7,
    hour: part('hour'),
    minute: part('minute'),
    second: part('second'),
  }
}

type NowParts = ReturnType<typeof getNowParts>

function shiftDate(c: Context<{ Bindings: Env }>, nowParts: NowParts): Date {
  const num = (name: string): number | undefined => {
    const raw = c.req.query(name)
    return raw === undefined ? undefined : Math.trunc(Number(raw))
  }

  const shifted = new Date(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.date, nowParts.hour, nowParts.minute, nowParts.second))

  // --- set ---
  const year = num('year')
  const month = num('month')
  if (year !== undefined) shifted.setUTCFullYear(year)
  if (month !== undefined) shifted.setUTCMonth(month - 1)

  const date = num('date')
  const week = num('week')
  const dayParam = c.req.query('day')
  const dayIndex = dayParam === undefined ? -1 : WEEKDAYS.indexOf(dayParam)

  if (week !== undefined) {
    const landing = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1))
    landing.setUTCDate(1 + (week - 1) * 7)
    if (date !== undefined) {
      shifted.setUTCFullYear(landing.getUTCFullYear(), landing.getUTCMonth(), date)
    } else {
      shifted.setUTCFullYear(landing.getUTCFullYear(), landing.getUTCMonth(), landing.getUTCDate())
      if (dayIndex >= 0) {
        const cur = (shifted.getUTCDay() + 6) % 7
        shifted.setUTCDate(shifted.getUTCDate() + (dayIndex - cur))
      }
    }
  } else if (date !== undefined) {
    shifted.setUTCDate(date)
  } else if (dayIndex >= 0) {
    const cur = (shifted.getUTCDay() + 6) % 7
    shifted.setUTCDate(shifted.getUTCDate() + (dayIndex - cur))
  }

  const hour = num('hour')
  const minute = num('minute')
  const second = num('second')
  if (hour !== undefined) shifted.setUTCHours(hour)
  if (minute !== undefined) shifted.setUTCMinutes(minute)
  if (second !== undefined) shifted.setUTCSeconds(second)

  // --- add ---
  const addyear = num('addyear')
  const addmonth = num('addmonth')
  const addweek = num('addweek')
  const adddate = num('adddate')
  const addhour = num('addhour')
  const addminute = num('addminute')
  const addsecond = num('addsecond')
  if (addyear !== undefined) shifted.setUTCFullYear(shifted.getUTCFullYear() + addyear)
  if (addmonth !== undefined) shifted.setUTCMonth(shifted.getUTCMonth() + addmonth)
  if (addweek !== undefined) shifted.setUTCDate(shifted.getUTCDate() + addweek * 7)
  if (adddate !== undefined) shifted.setUTCDate(shifted.getUTCDate() + adddate)
  if (addhour !== undefined) shifted.setUTCHours(shifted.getUTCHours() + addhour)
  if (addminute !== undefined) shifted.setUTCMinutes(shifted.getUTCMinutes() + addminute)
  if (addsecond !== undefined) shifted.setUTCSeconds(shifted.getUTCSeconds() + addsecond)

  return shifted
}

function buildDateOptions(fields: string[], digit: '2-digit' | 'numeric'): Intl.DateTimeFormatOptions {
  const options: Intl.DateTimeFormatOptions = { timeZone: 'UTC' }
  for (const field of fields) {
    switch (field) {
      case 'year':
        options.year = 'numeric'
        break
      case 'month':
        options.month = digit
        break
      case 'date':
        options.day = digit
        break
      case 'day':
        options.weekday = 'short'
        break
      case 'hour':
        options.hour = digit
        break
      case 'minute':
        options.minute = digit
        break
      case 'second':
        options.second = digit
        break
    }
  }
  return options
}

function textToCh(text: string): number {
  let total = 0
  for (const ch of text) total += (ch.codePointAt(0) ?? 0) > 0xff ? 2 : 1
  return total
}

function textToSize(text: string): { width: string; height: string } {
  const lines = text.split('\n')
  const maxUnits = Math.max(...lines.map(textToCh))
  return {
    width: `${maxUnits}ch`,
    height: `${(lines.length * 12) / 10}em`,
  }
}

function errorResponse(c: Context<{ Bindings: Env }>, errorCode: number, cacheControl = 'no-store'): Response {
  return viewTextResponse(c, `${errorCode} ${STATUS_TEXT[errorCode]}`, cacheControl)
}

function viewTextResponse(c: Context<{ Bindings: Env }>, text: string, cacheControl = 'no-store'): Response {
  const { width, height } = textToSize(text)
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const tspans = escaped
    .split('\n')
    .map((line, i) => `<tspan x="0" dy="${i === 0 ? '1em' : '1.2em'}">${line}</tspan>`)
    .join('')
  c.header('content-type', 'image/svg+xml')
  c.header('cache-control', cacheControl)
  return c.body(
    `<svg xmlns="http://www.w3.org/2000/svg" font-family="monospace" width="${width}" height="${height}"><text x="0">${tspans}</text></svg>`,
  )
}

function dataToSvgSize(value: number, status: number): { width: number; height: number } {
  return {
    width: value % BASE,
    height: 900 * Math.floor(value / BASE) + status - 100,
  }
}

function infoResponse(c: Context<{ Bindings: Env }>, value: number, status: number, cacheControl = 'no-store'): Response {
  const { width, height } = dataToSvgSize(value, status)
  c.header('content-type', 'image/svg+xml')
  c.header('cache-control', cacheControl)
  return c.body(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"></svg>`)
}

function clockResponse(c: Context<{ Bindings: Env }>, hour: number, minute: number, second: number, status: number): Response {
  const minuteSecond = minute * MINUTE + second
  const width = minuteSecond
  const height = hour * 900 + (status - 100)
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
  c.header('content-type', 'image/svg+xml')
  c.header('cache-control', 'no-store')
  return c.body(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${widthAnim}${heightAnim}</svg>`)
}

export class Presence extends DurableObject {
  lastHeartbeat = new Map<string, number>()

  heartbeat(uuid: string, now: number): number {
    this.lastHeartbeat.set(uuid, now)
    return this.countAlive(now)
  }

  peek(now: number): number {
    return this.countAlive(now)
  }

  private countAlive(now: number): number {
    let alive = 0
    for (const [id, t] of this.lastHeartbeat) {
      if (t >= now - 10 * SECOND_MS) alive++
      else this.lastHeartbeat.delete(id)
    }
    return alive
  }
}

export default app
