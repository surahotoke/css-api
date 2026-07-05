import { Hono } from 'hono'
import type { Context } from 'hono'
import { waitUntil } from 'cloudflare:workers'
import { CACHE_MEDIUM } from '../constants'
import { infoResponse, errorResponse } from './response'

const cache = caches.default

export const weather = new Hono<{ Bindings: Env }>()

weather.get('/temperature', async (c) => {
  const data = await fetchWeather(c)
  if (!data) return errorResponse(c, 502)
  const tempK10 = Math.round((data.current.temperature_2m + 273.15) * 10)
  return infoResponse(c, tempK10)
})

weather.get('/apparent-temperature', async (c) => {
  const data = await fetchWeather(c)
  if (!data) return errorResponse(c, 502)
  const apparentK10 = Math.round((data.current.apparent_temperature + 273.15) * 10)
  return infoResponse(c, apparentK10)
})

weather.get('/humidity', async (c) => {
  const data = await fetchWeather(c)
  if (!data) return errorResponse(c, 502)
  return infoResponse(c, data.current.relative_humidity_2m)
})

weather.get('/precipitation', async (c) => {
  const data = await fetchWeather(c)
  if (!data) return errorResponse(c, 502)
  return infoResponse(c, data.current.precipitation)
})

weather.get('/probability', async (c) => {
  const data = await fetchWeather(c)
  if (!data) return errorResponse(c, 502)
  return infoResponse(c, data.current.precipitation_probability)
})

weather.get('/wind-speed', async (c) => {
  const data = await fetchWeather(c)
  if (!data) return errorResponse(c, 502)
  return infoResponse(c, Math.round(data.current.wind_speed_10m))
})

weather.get('/weather-code', async (c) => {
  const data = await fetchWeather(c)
  if (!data) return errorResponse(c, 502)
  return infoResponse(c, data.current.weather_code)
})

weather.get('/pressure', async (c) => {
  const data = await fetchWeather(c)
  if (!data) return errorResponse(c, 502)
  return infoResponse(c, Math.round(data.current.surface_pressure))
})

async function fetchWeather(c: Context<{ Bindings: Env }>): Promise<any | null> {
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
