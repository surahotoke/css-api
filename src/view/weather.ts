import { Hono } from 'hono'
import { ERROR_CODE } from '../constants'
import { fetchWeather, weatherCodeToText } from '../weather'
import { viewTextResponse, errorResponse } from './response'

export const weather = new Hono<{ Bindings: Env }>()

weather.get('/now', async (c) => {
  const data = await fetchWeather(c)
  if (!data) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)

  const showRaw = c.req.query('show')
  const show = showRaw === undefined ? ['weather', 'temperature', 'humidity'] : showRaw.split(',').map((s) => s.trim())

  const VALID_FIELDS = [
    'weather-code',
    'weather',
    'temperature',
    'apparent-temperature',
    'humidity',
    'precipitation',
    'probability',
    'wind-speed',
    'pressure',
  ]
  if (show.includes('all')) show.splice(0, show.length, ...VALID_FIELDS)
  else if (show.some((f) => !VALID_FIELDS.includes(f))) return errorResponse(c, ERROR_CODE.BAD_REQUEST)

  return viewTextResponse(c, buildWeatherText(show, data))
})

function buildWeatherText(fields: string[], data: any): string {
  const parts: string[] = []
  for (const field of fields) {
    switch (field) {
      case 'weather-code':
        parts.push(String(data.current.weather_code))
        break
      case 'weather':
        parts.push(weatherCodeToText(data.current.weather_code))
        break
      case 'temperature':
        parts.push(`${data.current.temperature_2m}℃`)
        break
      case 'apparent-temperature':
        parts.push(`体感${data.current.apparent_temperature}℃`)
        break
      case 'humidity':
        parts.push(`湿度${data.current.relative_humidity_2m}%`)
        break
      case 'precipitation':
        parts.push(`降水${data.current.precipitation}mm`)
        break
      case 'probability':
        parts.push(`降水確率${data.current.precipitation_probability}%`)
        break
      case 'wind-speed':
        parts.push(`風速${data.current.wind_speed_10m}km/h`)
        break
      case 'pressure':
        parts.push(`気圧${data.current.surface_pressure}hPa`)
        break
    }
  }
  return parts.join(' ')
}
