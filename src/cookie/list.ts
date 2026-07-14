import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { COOKIE_OPT, ERROR_CODE } from '../constants'
import { successResponse, errorResponse as infoErrorResponse } from '../response/info'
import { VAR } from './common'
import { infoListIncludesResponse, infoListIndexResponse, viewListAtResponse } from './response'

export const list = new Hono<{ Bindings: Env }>()

list.get('/push/:name', (c) => {
  const name = VAR + c.req.param('name')
  const valueRaw = c.req.query('value')
  const cookie = getCookie(c, name)
  const current = cookie ?? ''
  if (valueRaw === undefined) return successResponse(c)
  const pushed = current === '' ? valueRaw : `${current},${valueRaw}`
  setCookie(c, name, pushed, COOKIE_OPT)
  return successResponse(c)
})

list.get('/remove/:name', (c) => {
  const name = VAR + c.req.param('name')
  const valueRaw = c.req.query('value')
  const indexRaw = c.req.query('index')
  const cookie = getCookie(c, name)
  if ((valueRaw === undefined) === (indexRaw === undefined)) return infoErrorResponse(c, ERROR_CODE.BAD_REQUEST)
  const items = cookie === undefined ? [] : cookie.split(',')
  let i: number
  if (valueRaw !== undefined) {
    i = items.indexOf(valueRaw)
  } else {
    const index = Math.trunc(Number(indexRaw))
    if (Number.isNaN(index)) return infoErrorResponse(c, ERROR_CODE.BAD_REQUEST)
    i = index < 0 ? items.length + index : index
  }
  if (i < 0 || i >= items.length) return infoErrorResponse(c, ERROR_CODE.NOT_FOUND)
  items.splice(i, 1)
  setCookie(c, name, items.join(','), COOKIE_OPT)
  return successResponse(c)
})

list.get('/includes/:name', (c) => infoListIncludesResponse(c, VAR))

list.get('/index/:name', (c) => infoListIndexResponse(c, VAR))

list.get('/at/:name', (c) => viewListAtResponse(c, VAR))
