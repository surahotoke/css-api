import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { COOKIE_OPT } from './constants'

export const heartbeat = new Hono<{ Bindings: Env }>()

heartbeat.get('/', async (c) => {
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
