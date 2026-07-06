import { Hono } from 'hono'
import { ERROR_CODE } from '../constants'
import { fetchWeather } from './common'
import { infoResponse, errorResponse } from '../response/info'

export const info = new Hono<{ Bindings: Env }>()

info.get('/temperature', async (c) => {
  const data = await fetchWeather(c)
  if (!data) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  const tempK10 = Math.round((data.current.temperature_2m + 273.15) * 10)
  return infoResponse(c, tempK10)
})

info.get('/apparent-temperature', async (c) => {
  const data = await fetchWeather(c)
  if (!data) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  const apparentK10 = Math.round((data.current.apparent_temperature + 273.15) * 10)
  return infoResponse(c, apparentK10)
})

info.get('/humidity', async (c) => {
  const data = await fetchWeather(c)
  if (!data) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  return infoResponse(c, data.current.relative_humidity_2m)
})

info.get('/precipitation', async (c) => {
  const data = await fetchWeather(c)
  if (!data) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  return infoResponse(c, data.current.precipitation)
})

info.get('/probability', async (c) => {
  const data = await fetchWeather(c)
  if (!data) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  return infoResponse(c, data.current.precipitation_probability)
})

info.get('/wind-speed', async (c) => {
  const data = await fetchWeather(c)
  if (!data) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  return infoResponse(c, Math.round(data.current.wind_speed_10m))
})

info.get('/weather-code', async (c) => {
  const data = await fetchWeather(c)
  if (!data) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  return infoResponse(c, data.current.weather_code)
})

info.get('/pressure', async (c) => {
  const data = await fetchWeather(c)
  if (!data) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
  return infoResponse(c, Math.round(data.current.surface_pressure))
})
