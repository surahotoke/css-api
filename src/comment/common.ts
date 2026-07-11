import { getCookie } from 'hono/cookie'
import type { Context } from 'hono'

export const LIST_LIMIT = 20
export const NAME_MAX = 24
export const NAME_PATTERN = new RegExp(`^[\\p{L}\\p{N}\\p{M}・._\\-]{1,${NAME_MAX}}$`, 'v')
export const COMMENT_MAX = 280
export const DEFAULT_NAME = '名無し'
export const COMMENT_NAME_COOKIE = 'server_comment.name'

/** コメント投稿者名（未設定・不正値なら名無し） */
export function getName(c: Context<{ Bindings: Env }>): string {
  const name = getCookie(c, COMMENT_NAME_COOKIE)?.normalize('NFC').trim()
  return name && NAME_PATTERN.test(name) ? name : DEFAULT_NAME
}
