import { Hono } from 'hono'
import { ERROR_CODE } from '../constants'
import { fetchStockQuote, fetchStockOpen } from '../stock'
import { infoResponse, errorResponse } from './response'

export const stock = new Hono<{ Bindings: Env }>()

stock.get('/open/:symbol', async (c) => {
  const now = new Date()
  const symbol = c.req.param('symbol')
  const value = await fetchStockOpen(c.env, symbol, now)
  if (value === null) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  return infoResponse(c, value)
})

stock.get('/high/:symbol', async (c) => {
  const now = new Date()
  const symbol = c.req.param('symbol')
  const quote = await fetchStockQuote(c.env, symbol, now)
  if (quote === null) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  return infoResponse(c, quote.high)
})

stock.get('/low/:symbol', async (c) => {
  const now = new Date()
  const symbol = c.req.param('symbol')
  const quote = await fetchStockQuote(c.env, symbol, now)
  if (quote === null) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  return infoResponse(c, quote.low)
})

stock.get('/close/:symbol', async (c) => {
  const now = new Date()
  const symbol = c.req.param('symbol')
  const quote = await fetchStockQuote(c.env, symbol, now)
  if (quote === null) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  return infoResponse(c, quote.close)
})
