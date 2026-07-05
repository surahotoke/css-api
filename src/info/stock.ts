import { Hono } from 'hono'
import { waitUntil } from 'cloudflare:workers'
import { SECOND_MS, ERROR_CODE } from '../constants'
import { infoResponse, errorResponse } from './response'

export const stock = new Hono<{ Bindings: Env }>()

/** JIG.jp の株価銘柄コード（東証） */
export const JIG_STOCK_SYMBOL = '5244.T'

type YahooChartResponse = {
  chart?: {
    result?: {
      indicators?: {
        quote?: Record<string, (number | null)[]>[]
      }
    }[]
  }
}

stock.get('/open/:symbol', async (c) => {
  const now = new Date()
  const symbol = c.req.param('symbol')
  const value = await fetchStockValue(c.env, symbol, 'open', now)
  if (value === null) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  return infoResponse(c, value)
})

stock.get('/high/:symbol', async (c) => {
  const now = new Date()
  const symbol = c.req.param('symbol')
  const value = await fetchStockValue(c.env, symbol, 'high', now)
  if (value === null) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  return infoResponse(c, value)
})

stock.get('/low/:symbol', async (c) => {
  const now = new Date()
  const symbol = c.req.param('symbol')
  const value = await fetchStockValue(c.env, symbol, 'low', now)
  if (value === null) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  return infoResponse(c, value)
})

stock.get('/close/:symbol', async (c) => {
  const now = new Date()
  const symbol = c.req.param('symbol')
  const value = await fetchStockValue(c.env, symbol, 'close', now)
  if (value === null) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  return infoResponse(c, value)
})

export async function fetchStockValue(env: Env, symbol: string, type: string, now: Date): Promise<number | null> {
  const cacheKey = `stock-${type}-${symbol}`
  const canCache = type === 'open' || isMarketClosed(now)

  if (canCache) {
    const cached = await env.KV.get(cacheKey)
    if (cached !== null) return Number(cached)
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) return null
    const data = (await res.json()) as YahooChartResponse
    const quote = data.chart?.result?.[0]?.indicators?.quote?.[0]
    const value = quote?.[type]?.[0]
    if (typeof value !== 'number') return null

    if (canCache) waitUntil(env.KV.put(cacheKey, String(value), { expirationTtl: secondsUntilNextOpen(now) }))
    return value
  } catch {
    return null
  }
}

function isMarketClosed(now: Date): boolean {
  const open = new Date(now)
  open.setUTCHours(0, 0, 0, 0)
  const close = new Date(now)
  close.setUTCHours(6, 35, 0, 0)
  return now.getTime() < open.getTime() || close.getTime() <= now.getTime()
}

function secondsUntilNextOpen(now: Date): number {
  const next = new Date(now)
  next.setUTCHours(0, 5, 0, 0)
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1)
  return Math.floor((next.getTime() - now.getTime()) / SECOND_MS)
}
