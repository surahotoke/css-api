import { LIMIT_VALUE, SUCCESS_CODE } from '../constants'
import { SVG_NAMESPACE, type CacheOption } from './common'
import type { Context } from 'hono'

export type InfoOptions = CacheOption & {
  status?: number
  subValue?: number
  content?: string
}

export type StatusOptions = CacheOption & {
  status?: number
}

function dataToSvgSize(value: number, status: number, subValue: number = 0): { width: number; height: number } {
  return {
    width: value + LIMIT_VALUE,
    height: 900 * subValue + status - 100,
  }
}

export function infoResponse(
  c: Context<{ Bindings: Env }>,
  value: number,
  { status = SUCCESS_CODE.OK, subValue = 0, content = '', cacheControl = 'no-store' }: InfoOptions = {},
): Response {
  const { width, height } = dataToSvgSize(value, status, subValue)
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
