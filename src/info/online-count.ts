import { Hono } from 'hono'
import { infoResponse } from './response'

export const onlineCount = new Hono<{ Bindings: Env }>()

onlineCount.get('/', async (c) => {
  const online = await c.env.PRESENCE.getByName('global').peek(Date.now())
  return infoResponse(c, online)
})
