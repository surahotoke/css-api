import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { COOKIE_OPT, VALUE_MAX, ERROR_CODE } from './constants'
import { infoResponse, errorResponse } from './response/info'

export const cookie = new Hono<{ Bindings: Env }>()

cookie.get('/get/:name', (c) => {
  const name = c.req.param('name')
  const raw = getCookie(c, name)
  if (raw === undefined) return errorResponse(c, ERROR_CODE.NOT_FOUND)
  const value = Math.round(Number(raw))
  if (Number.isNaN(value) || value < 0 || value > VALUE_MAX) return errorResponse(c, ERROR_CODE.NOT_FOUND)
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
