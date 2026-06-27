import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { COOKIE_OPT, VALUE_MAX } from './constants'
import { infoResponse } from './response'

export const cookie = new Hono<{ Bindings: Env }>()

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
