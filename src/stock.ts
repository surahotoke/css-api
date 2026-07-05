import { waitUntil } from 'cloudflare:workers'
import { CACHE_SHORT, SECOND_MS } from './constants'

/** JIG.jp の株価銘柄コード（東証） */
export const JIG_STOCK_SYMBOL = '5244.T'

export type StockField = 'open' | 'high' | 'low' | 'close'

export type StockQuote = Record<StockField, number>

const STOCK_FIELDS: StockField[] = ['open', 'high', 'low', 'close']

type YahooChartResponse = {
  chart?: {
    result?: {
      indicators?: {
        quote?: Record<string, (number | null)[]>[]
      }
    }[]
  }
}

export async function fetchStockQuote(env: Env, symbol: string, now: Date): Promise<StockQuote | null> {
  const cacheKey = `stock-quote-${symbol}`

  const cached = await env.KV.get<StockQuote>(cacheKey, 'json')
  if (cached !== null) return cached

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) return null
    const data = (await res.json()) as YahooChartResponse
    const raw = data.chart?.result?.[0]?.indicators?.quote?.[0]

    const quote = {} as StockQuote
    for (const field of STOCK_FIELDS) {
      const value = raw?.[field]?.[0]
      if (typeof value !== 'number') return null
      quote[field] = value
    }

    // 場外は翌オープンまで、場中は CACHE_SHORT だけキャッシュ
    const openTtl = secondsUntilNextOpen(now)
    const quoteTtl = isMarketClosed(now) ? openTtl : CACHE_SHORT
    waitUntil(env.KV.put(cacheKey, JSON.stringify(quote), { expirationTtl: quoteTtl }))
    // 始値は場中でも確定済みなので常に翌オープンまでキャッシュ
    waitUntil(env.KV.put(`stock-open-${symbol}`, String(quote.open), { expirationTtl: openTtl }))
    return quote
  } catch {
    return null
  }
}

/** 始値は日中変わらないため、専用の長期キャッシュを先に見る */
export async function fetchStockOpen(env: Env, symbol: string, now: Date): Promise<number | null> {
  const cached = await env.KV.get(`stock-open-${symbol}`)
  if (cached !== null) return Number(cached)
  const quote = await fetchStockQuote(env, symbol, now)
  return quote?.open ?? null
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
