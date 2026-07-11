import { HTTPException } from 'hono/http-exception'
import { ERROR_CODE, REDIRECT_CODE } from '../constants'
import type { Context } from 'hono'

/** リクエスト元（referer）へリダイレクトして返す。referer が無ければ不正リクエストとして弾く */
export function refererRedirect(c: Context<{ Bindings: Env }>): Response {
  const referer = c.req.header('referer')
  if (referer === undefined) throw new HTTPException(ERROR_CODE.BAD_REQUEST)
  return c.redirect(referer, REDIRECT_CODE.SEE_OTHER)
}
