import { Hono } from 'hono'
import { ERROR_CODE } from '../constants'
import { fetchStockQuote, fetchStockOpen } from './common'
import { infoResponse, errorResponse } from '../response/info'

export const info = new Hono<{ Bindings: Env }>()

info.get('/open/:symbol', async (c) => {
  const now = new Date()
  const symbol = c.req.param('symbol')
  const value = await fetchStockOpen(c.env, symbol, now)
  if (value === null) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  return infoResponse(c, value)
})

info.get('/high/:symbol', async (c) => {
  const now = new Date()
  const symbol = c.req.param('symbol')
  const quote = await fetchStockQuote(c.env, symbol, now)
  if (quote === null) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  return infoResponse(c, quote.high)
})

info.get('/low/:symbol', async (c) => {
  const now = new Date()
  const symbol = c.req.param('symbol')
  const quote = await fetchStockQuote(c.env, symbol, now)
  if (quote === null) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  return infoResponse(c, quote.low)
})

info.get('/close/:symbol', async (c) => {
  const now = new Date()
  const symbol = c.req.param('symbol')
  const quote = await fetchStockQuote(c.env, symbol, now)
  if (quote === null) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  return infoResponse(c, quote.close)
})
