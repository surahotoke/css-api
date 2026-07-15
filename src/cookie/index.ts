import { Hono } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { COOKIE_OPT } from '../constants'
import { successResponse } from '../response/info'
import { VAR } from './common'
import { number } from './number'
import { list } from './list'
import { env } from './env'
import { viewValueResponse } from './response'

export const cookie = new Hono<{ Bindings: Env }>()

cookie.get('/view/:name', (c) => viewValueResponse(c, VAR))

cookie.get('/set/:name', (c) => {
  const name = VAR + c.req.param('name')
  const valueRaw = c.req.query('value')
  setCookie(c, name, valueRaw ?? '', COOKIE_OPT)
  return successResponse(c)
})

cookie.get('/delete/:name', (c) => {
  const name = VAR + c.req.param('name')
  deleteCookie(c, name, COOKIE_OPT)
  return successResponse(c)
})

cookie.route('/number', number)
cookie.route('/list', list)
cookie.route('/env', env)
