import { Hono } from 'hono'
import { infoResponse } from '../response/info'

export const info = new Hono<{ Bindings: Env }>()

info.get('/', async (c) => {
  const online = await c.env.PRESENCE.getByName('global').peek(Date.now())
  return infoResponse(c, online)
})
