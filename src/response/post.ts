import { HTTPException } from 'hono/http-exception'
import { REDIRECT_CODE, ERROR_CODE } from '../constants'
import type { Context } from 'hono'

/** referer を返す。無ければ不正リクエストとして弾く */
export function getRefererOrThrow(c: Context<{ Bindings: Env }>): string {
  const referer = c.req.header('referer')
  if (referer === undefined) throw new HTTPException(ERROR_CODE.BAD_REQUEST)
  return referer
}

/** リクエスト元（referer）へリダイレクトして返す */
export function refererRedirect(c: Context<{ Bindings: Env }>): Response {
  return c.redirect(getRefererOrThrow(c), REDIRECT_CODE.SEE_OTHER)
}
