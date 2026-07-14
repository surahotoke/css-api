import { getCookie } from 'hono/cookie'
import { VALUE_MAX, ERROR_CODE } from '../constants'
import { infoResponse, errorResponse as infoErrorResponse } from '../response/info'
import { viewTextResponse, errorResponse as viewErrorResponse } from '../response/view'
import type { Context } from 'hono'
import type { CookiePrefix } from './common'

/** cookie の値をテキスト画像で返す（存在しなければ 404） */
export function viewValueResponse(c: Context<{ Bindings: Env }>, prefix: CookiePrefix): Response {
  const name = prefix + c.req.param('name')
  const cookie = getCookie(c, name)
  if (cookie === undefined) return viewErrorResponse(c, ERROR_CODE.NOT_FOUND)
  return viewTextResponse(c, cookie)
}

/** cookie の値を数値として返す（数値でない・範囲外なら 404） */
export function infoNumberResponse(c: Context<{ Bindings: Env }>, prefix: CookiePrefix): Response {
  const name = prefix + c.req.param('name')
  const cookie = getCookie(c, name)
  if (cookie === undefined) return infoErrorResponse(c, ERROR_CODE.NOT_FOUND)
  const value = Math.round(Number(cookie))
  if (Number.isNaN(value) || value < 0 || value > VALUE_MAX) return infoErrorResponse(c, ERROR_CODE.NOT_FOUND)
  return infoResponse(c, value)
}

/** 「,」区切りリストに要素が含まれるかを 1/0 で返す */
export function infoListIncludesResponse(c: Context<{ Bindings: Env }>, prefix: CookiePrefix): Response {
  const name = prefix + c.req.param('name')
  const valueRaw = c.req.query('value')
  if (valueRaw === undefined) return infoErrorResponse(c, ERROR_CODE.BAD_REQUEST)
  const cookie = getCookie(c, name)
  const items = cookie === undefined ? [] : cookie.split(',')
  return infoResponse(c, items.includes(valueRaw) ? 1 : 0)
}

/** 「,」区切りリスト内で要素が何番目かを返す（見つからなければ 404） */
export function infoListIndexResponse(c: Context<{ Bindings: Env }>, prefix: CookiePrefix): Response {
  const name = prefix + c.req.param('name')
  const valueRaw = c.req.query('value')
  if (valueRaw === undefined) return infoErrorResponse(c, ERROR_CODE.BAD_REQUEST)
  const cookie = getCookie(c, name)
  const items = cookie === undefined ? [] : cookie.split(',')
  const i = items.indexOf(valueRaw)
  if (i < 0) return infoErrorResponse(c, ERROR_CODE.NOT_FOUND)
  return infoResponse(c, i)
}

/** 「,」区切りリストの指定位置の要素をテキスト画像で返す */
export function viewListAtResponse(c: Context<{ Bindings: Env }>, prefix: CookiePrefix): Response {
  const name = prefix + c.req.param('name')
  const indexRaw = c.req.query('index')
  const index = indexRaw === undefined ? NaN : Math.trunc(Number(indexRaw))
  if (Number.isNaN(index)) return viewErrorResponse(c, ERROR_CODE.BAD_REQUEST)
  const cookie = getCookie(c, name)
  const items = cookie === undefined ? [] : cookie.split(',')
  const item = items.at(index)
  if (item === undefined) return viewErrorResponse(c, ERROR_CODE.NOT_FOUND)
  return viewTextResponse(c, item)
}
