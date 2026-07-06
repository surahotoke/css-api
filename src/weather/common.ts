import type { Context } from 'hono'
import { waitUntil } from 'cloudflare:workers'
import { CACHE_MEDIUM } from '../constants'

const cache = caches.default

export async function fetchWeather(c: Context<{ Bindings: Env }>): Promise<any | null> {
  const cf = c.req.raw.cf
  const lat = c.req.query('lat') ?? cf?.latitude ?? '35.6895'
  const lon = c.req.query('lon') ?? cf?.longitude ?? '139.6917'
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,apparent_temperature,wind_speed_10m,weather_code,surface_pressure`
  const cacheKey = new Request(url)
  const cached = await cache.match(cacheKey)
  if (cached) {
    return await cached.json()
  }
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const cachedRes = new Response(JSON.stringify(data), {
      headers: {
        'content-type': 'application/json',
        'cache-control': `max-age=${CACHE_MEDIUM}`,
      },
    })
    waitUntil(cache.put(cacheKey, cachedRes))
    return data
  } catch {
    return null
  }
}

const WEATHER_CODE_TEXT: Record<number, string> = {
  0: '快晴',
  1: 'ほぼ晴れ',
  2: '薄曇',
  3: '曇り',
  45: '霧',
  48: '着氷霧',
  51: '軽い霧雨',
  53: '霧雨',
  55: '密な霧雨',
  56: '軽い着氷性霧雨',
  57: '密な着氷性霧雨',
  61: '小雨',
  63: '雨',
  65: '大雨',
  66: '着氷性雨',
  67: '強い着氷性雨',
  71: '小雪',
  73: '雪',
  75: '大雪',
  77: '雪粒',
  80: 'にわか雨',
  81: 'にわか雨',
  82: '激しいにわか雨',
  85: 'にわか雪',
  86: '激しいにわか雪',
  95: '雷雨',
  96: '雹を伴う雷雨',
  99: '大雹を伴う雷雨',
}

export function weatherCodeToText(code: number): string {
  return WEATHER_CODE_TEXT[code] ?? '不明'
}
