import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { COOKIE_OPT } from './constants'
import { viewTextResponse } from './response/view'

export const heartbeat = new Hono<{ Bindings: Env }>()

heartbeat.get('/', async (c) => {
  const now = new Date()
  let uuid = getCookie(c, 'uuid')
  if (!uuid) {
    uuid = crypto.randomUUID()
    setCookie(c, 'uuid', uuid, COOKIE_OPT)
  }
  const online = await c.env.PRESENCE.getByName('global').heartbeat(uuid, now)
  return viewTextResponse(c, `Online: ${online}`)
})
