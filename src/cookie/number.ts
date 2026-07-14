import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { COOKIE_OPT, ERROR_CODE } from '../constants'
import { successResponse, errorResponse } from '../response/info'
import { VAR } from './common'
import { infoNumberResponse } from './response'

export const number = new Hono<{ Bindings: Env }>()

number.get('/get/:name', (c) => infoNumberResponse(c, VAR))

number.get('/add/:name', (c) => {
  const name = VAR + c.req.param('name')
  const valueRaw = c.req.query('value')
  const cookie = getCookie(c, name)
  const current = cookie === undefined ? 0 : Number(cookie)
  const addend = valueRaw === undefined ? 1 : Number(valueRaw)
  if (Number.isNaN(current) || Number.isNaN(addend)) return errorResponse(c, ERROR_CODE.BAD_REQUEST)
  setCookie(c, name, String(current + addend), COOKIE_OPT)
  return successResponse(c)
})
