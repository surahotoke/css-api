import { BASE, SUCCESS_CODE } from '../constants'
import type { Context } from 'hono'

function dataToSvgSize(value: number, status: number): { width: number; height: number } {
  return {
    width: value % BASE,
    height: 900 * Math.floor(value / BASE) + status - 100,
  }
}

export function infoResponse(
  c: Context<{ Bindings: Env }>,
  value: number,
  status: number = SUCCESS_CODE.OK,
  content = '',
  cacheControl = 'no-store',
): Response {
  const { width, height } = dataToSvgSize(value, status)
  c.header('content-type', 'image/svg+xml')
  c.header('cache-control', cacheControl)
  return c.body(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${content}</svg>`)
}

export function successResponse(c: Context<{ Bindings: Env }>, cacheControl = 'no-store'): Response {
  return infoResponse(c, 0, SUCCESS_CODE.OK, '', cacheControl)
}

export function errorResponse(c: Context<{ Bindings: Env }>, errorCode: number, cacheControl = 'no-store'): Response {
  return infoResponse(c, 0, errorCode, '', cacheControl)
}
