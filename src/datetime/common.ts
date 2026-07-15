import { DEFAULT_TIMEZONE, FMT_LOCALE, DEFAULT_LOCALE, WEEKDAYS } from '../constants'
import type { Context } from 'hono'

/** アクセス元のタイムゾーンを返す（取得できなければ既定のタイムゾーン） */
export function getTimezone(c: Context<{ Bindings: Env }>): string {
  return (c.req.raw.cf?.timezone as string) ?? DEFAULT_TIMEZONE
}

/** 表示用ロケールを返す（fmt クエリ → Accept-Language → 既定ロケールの順で採用） */
export function getLocale(c: Context<{ Bindings: Env }>): string {
  return c.req.query('fmt') || c.req.header('Accept-Language')?.split(',')[0]?.trim() || DEFAULT_LOCALE
}

/** 指定タイムゾーンにおける現在日時を、年・月・日・曜日・時・分・秒に分解して返す（曜日は月曜が 0） */
export function getNowFields(now: Date, timezone: string = DEFAULT_TIMEZONE) {
  const today = new Intl.DateTimeFormat(FMT_LOCALE, { timeZone: timezone }).format(now)
  const parts = getDateTimeFormatYMDhms(FMT_LOCALE, timezone).formatToParts(now)
  const part = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0)
  return {
    year: part('year'),
    month: part('month'),
    date: part('day'),
    day: (new Date(today).getUTCDay() + 6) % 7,
    hour: part('hour'),
    minute: part('minute'),
    second: part('second'),
  }
}

export type NowFields = ReturnType<typeof getNowFields>

/** 現在日時（nowFields）を基準に、クエリの set/add 系パラメータで年月日時分秒をずらした Date を返す */
export function shiftDate(c: Context<{ Bindings: Env }>, nowFields: NowFields): Date {
  const getField = (name: string): number | undefined => {
    const raw = c.req.query(name)
    if (name === 'day') {
      const i = WEEKDAYS.indexOf(raw ?? '')
      return i < 0 ? undefined : i
    }
    return raw === undefined ? undefined : Math.trunc(Number(raw))
  }

  const shifted = new Date(
    Date.UTC(nowFields.year, nowFields.month - 1, nowFields.date, nowFields.hour, nowFields.minute, nowFields.second),
  )

  // --- set ---
  const year = getField('year')
  const month = getField('month')
  const week = getField('week')
  const date = getField('date')
  const dayIndex = getField('day')
  const hour = getField('hour')
  const minute = getField('minute')
  const second = getField('second')
  if (year !== undefined) shifted.setUTCFullYear(year)
  if (month !== undefined) shifted.setUTCMonth(month - 1)
  if (week !== undefined) shifted.setUTCFullYear(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1 + (week - 1) * 7)
  if (date !== undefined) shifted.setUTCDate(date)
  if (dayIndex !== undefined) shifted.setUTCDate(shifted.getUTCDate() + dayIndex - ((shifted.getUTCDay() + 6) % 7))
  if (hour !== undefined) shifted.setUTCHours(hour)
  if (minute !== undefined) shifted.setUTCMinutes(minute)
  if (second !== undefined) shifted.setUTCSeconds(second)

  // --- add ---
  const addyear = getField('addyear')
  const addmonth = getField('addmonth')
  const addweek = getField('addweek')
  const adddate = getField('adddate')
  const addhour = getField('addhour')
  const addminute = getField('addminute')
  const addsecond = getField('addsecond')
  if (addyear !== undefined) shifted.setUTCFullYear(shifted.getUTCFullYear() + addyear)
  if (addmonth !== undefined) shifted.setUTCMonth(shifted.getUTCMonth() + addmonth)
  if (addweek !== undefined) shifted.setUTCDate(shifted.getUTCDate() + addweek * 7)
  if (adddate !== undefined) shifted.setUTCDate(shifted.getUTCDate() + adddate)
  if (addhour !== undefined) shifted.setUTCHours(shifted.getUTCHours() + addhour)
  if (addminute !== undefined) shifted.setUTCMinutes(shifted.getUTCMinutes() + addminute)
  if (addsecond !== undefined) shifted.setUTCSeconds(shifted.getUTCSeconds() + addsecond)

  return shifted
}

/** 表示する項目名の配列から、Intl.DateTimeFormat 用のオプションを組み立てる */
export function buildDateOptions(fields: string[], digit: '2-digit' | 'numeric'): Intl.DateTimeFormatOptions {
  const options: Intl.DateTimeFormatOptions = { timeZone: 'UTC' }
  for (const field of fields) {
    switch (field) {
      case 'year':
        options.year = 'numeric'
        break
      case 'month':
        options.month = digit
        break
      case 'date':
        options.day = digit
        break
      case 'day':
        options.weekday = 'short'
        break
      case 'hour':
        options.hour = digit
        break
      case 'minute':
        options.minute = digit
        break
      case 'second':
        options.second = digit
        break
    }
  }
  return options
}

/** 見る人のロケール・タイムゾーンで、年月日時分の日時フォーマッタを返す */
export function getDateTimeFormatYMDhm(c: Context<{ Bindings: Env }>): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(getLocale(c), {
    timeZone: getTimezone(c),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** 指定ロケール・タイムゾーンで、年月日時分秒の日時フォーマッタを返す */
export function getDateTimeFormatYMDhms(locale: string, timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
