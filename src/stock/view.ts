import { Hono } from 'hono'
import { ERROR_CODE } from '../constants'
import { fetchStockQuote, fetchStockOpen, type StockField } from './common'
import { viewTextResponse, errorResponse } from '../response/view'

export const view = new Hono<{ Bindings: Env }>()

const VALID_FIELDS = ['open', 'high', 'low', 'close']

const FIELD_LABEL: Record<StockField, string> = {
  open: '始値',
  high: '高値',
  low: '安値',
  close: '終値',
}

view.get('/:symbol', async (c) => {
  const now = new Date()
  const symbol = c.req.param('symbol')

  const showRaw = c.req.query('show')
  const show = showRaw === undefined ? ['close'] : showRaw.split(',').map((s) => s.trim())

  if (show.includes('all')) show.splice(0, show.length, ...VALID_FIELDS)
  else if (show.some((f) => !VALID_FIELDS.includes(f))) return errorResponse(c, ERROR_CODE.BAD_REQUEST)

  const unit = symbol.endsWith('.T') ? '円' : ''

  // 始値のみの場合は info/stock の /open と同じく専用の長期キャッシュを使う
  if (show.length === 1 && show[0] === 'open') {
    const open = await fetchStockOpen(c.env, symbol, now)
    if (open === null) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)
    return viewTextResponse(c, `${FIELD_LABEL.open}${open}${unit}`)
  }

  const quote = await fetchStockQuote(c.env, symbol, now)
  if (quote === null) return errorResponse(c, ERROR_CODE.BAD_GATEWAY)

  const text = (show as StockField[]).map((field) => `${FIELD_LABEL[field]}${quote[field]}${unit}`).join(' ')
  return viewTextResponse(c, text)
})
