import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { COOKIE_OPT } from './constants'
import { viewTextResponse } from './response/view'
import { ENV } from './cookie/common'

const UUID_COOKIE = ENV + 'uuid'

export const heartbeat = new Hono<{ Bindings: Env }>()

heartbeat.get('/', async (c) => {
  const now = new Date()
  let uuid = getCookie(c, UUID_COOKIE)
  if (!uuid) {
    uuid = crypto.randomUUID()
    setCookie(c, UUID_COOKIE, uuid, COOKIE_OPT)
  }
  const online = await c.env.PRESENCE.getByName('global').heartbeat(uuid, now)
  return viewTextResponse(c, `Online: ${online}`)
})
