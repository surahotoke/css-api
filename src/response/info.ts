import { BASE, SUCCESS_CODE } from '../constants'
import { SVG_NAMESPACE, type CacheOption } from './common'
import type { Context } from 'hono'

export type InfoOptions = CacheOption & {
  status?: number
  content?: string
}

export type StatusOptions = CacheOption & {
  status?: number
}

function dataToSvgSize(value: number, status: number): { width: number; height: number } {
  return {
    width: value % BASE,
    height: 900 * Math.floor(value / BASE) + status - 100,
  }
}

export function infoResponse(
  c: Context<{ Bindings: Env }>,
  value: number,
  { status = SUCCESS_CODE.OK, content = '', cacheControl = 'no-store' }: InfoOptions = {},
): Response {
  const { width, height } = dataToSvgSize(value, status)
  c.header('content-type', 'image/svg+xml')
  c.header('cache-control', cacheControl)
  return c.body(`<svg xmlns="${SVG_NAMESPACE}" width="${width}" height="${height}">${content}</svg>`)
}

export function successResponse(
  c: Context<{ Bindings: Env }>,
  { status = SUCCESS_CODE.OK, cacheControl = 'no-store' }: StatusOptions = {},
): Response {
  return infoResponse(c, 0, { status, cacheControl })
}

export function errorResponse(c: Context<{ Bindings: Env }>, errorCode: number, { cacheControl = 'no-store' }: CacheOption = {}): Response {
  return infoResponse(c, 0, { status: errorCode, cacheControl })
}
