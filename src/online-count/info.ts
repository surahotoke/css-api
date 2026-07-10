import { Hono } from 'hono'
import { infoResponse } from '../response/info'

export const info = new Hono<{ Bindings: Env }>()

info.get('/', async (c) => {
  const now = new Date()
  const online = await c.env.PRESENCE.getByName('global').peek(now.getTime())
  return infoResponse(c, online)
})
