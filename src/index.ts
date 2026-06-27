import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { DurableObject, waitUntil } from 'cloudflare:workers'
import { Kysely, sql } from 'kysely'
import { D1Dialect } from 'kysely-d1'
import type { Context } from 'hono'

const DEFAULT_TIMEZONE = 'Asia/Tokyo'

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
const datetime = new Hono<{ Bindings: Env }>()

const COOKIE_OPT = { sameSite: 'None', secure: true, maxAge: 34560000, path: '/' } as const

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
  return c.body(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="24"><text x="0" y="20" font-size="18">Online: ${online}</text></svg>`,
  )
})

datetime.get('/clock', (c) => {
  const now = new Date()
  const nowParts = getNowParts(now, getTimezone(c))
  return clockResponse(c, nowParts.hour, nowParts.minute, nowParts.second, 200)
})

datetime.get('/current-time', (c) => {
  const now = new Date()
  const nowParts = getNowParts(now, getTimezone(c))
  const value = nowParts.hour * HOUR + nowParts.minute * MINUTE + nowParts.second
  return infoResponse(c, value, 200)
})

datetime.get('/current-date', (c) => {
  const now = new Date()
  const nowParts = getNowParts(now, getTimezone(c))
  const value = nowParts.year * 372 + (nowParts.month - 1) * 31 + (nowParts.date - 1)
  return infoResponse(c, value, 200)
})

datetime.get('/current-day', (c) => {
  const now = new Date()
  const nowParts = getNowParts(now, getTimezone(c))
  return infoResponse(c, nowParts.day, 200)
})

info.route('/datetime', datetime)

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

function getTimezone(c: Context<{ Bindings: Env }>): string {
  return (c.req.raw.cf?.timezone as string) ?? DEFAULT_TIMEZONE
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
