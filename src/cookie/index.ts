import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { COOKIE_OPT, ERROR_CODE } from '../constants'
import { successResponse } from '../response/info'
import { viewTextResponse, errorResponse } from '../response/view'
import { number } from './number'
import { list } from './list'

export const cookie = new Hono<{ Bindings: Env }>()

cookie.get('/view/:name', (c) => {
  const name = c.req.param('name')
  const cookie = getCookie(c, name)
  if (cookie === undefined) return errorResponse(c, ERROR_CODE.NOT_FOUND)
  return viewTextResponse(c, cookie)
})

cookie.get('/set/:name', (c) => {
  const name = c.req.param('name')
  const valueRaw = c.req.query('value')
  setCookie(c, name, valueRaw ?? '', COOKIE_OPT)
  return successResponse(c)
})

cookie.get('/delete/:name', (c) => {
  const name = c.req.param('name')
  deleteCookie(c, name, COOKIE_OPT)
  return successResponse(c)
})

cookie.route('/number', number)
cookie.route('/list', list)
