import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { COOKIE_OPT, VALUE_MAX } from './constants'
import { infoResponse, errorResponse } from './info/response'

export const cookie = new Hono<{ Bindings: Env }>()

cookie.get('/get/:name', (c) => {
  const name = c.req.param('name')
  const raw = getCookie(c, name)
  if (raw === undefined) {
    return errorResponse(c, 404)
  }
  const value = Math.round(Number(raw))
  if (Number.isNaN(value) || value < 0 || value > VALUE_MAX) {
    return errorResponse(c, 404)
  }
  return infoResponse(c, value)
})

cookie.get('/set/:name', (c) => {
  const name = c.req.param('name')
  setCookie(c, name, c.req.query('value') ?? '', COOKIE_OPT)
  return infoResponse(c, 0)
})

cookie.get('/delete/:name', (c) => {
  const name = c.req.param('name')
  deleteCookie(c, name, COOKIE_OPT)
  return infoResponse(c, 0)
})
