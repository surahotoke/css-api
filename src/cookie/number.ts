import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { COOKIE_OPT, VALUE_MAX, ERROR_CODE } from '../constants'
import { infoResponse, successResponse, errorResponse } from '../response/info'

export const number = new Hono<{ Bindings: Env }>()

number.get('/get/:name', (c) => {
  const name = c.req.param('name')
  const cookie = getCookie(c, name)
  if (cookie === undefined) return errorResponse(c, ERROR_CODE.NOT_FOUND)
  const value = Math.round(Number(cookie))
  if (Number.isNaN(value) || value < 0 || value > VALUE_MAX) return errorResponse(c, ERROR_CODE.NOT_FOUND)
  return infoResponse(c, value)
})

number.get('/add/:name', (c) => {
  const name = c.req.param('name')
  const valueRaw = c.req.query('value')
  const cookie = getCookie(c, name)
  const current = cookie === undefined ? 0 : Number(cookie)
  const addend = valueRaw === undefined ? 1 : Number(valueRaw)
  if (Number.isNaN(current) || Number.isNaN(addend)) return errorResponse(c, ERROR_CODE.BAD_REQUEST)
  setCookie(c, name, String(current + addend), COOKIE_OPT)
  return successResponse(c)
})
