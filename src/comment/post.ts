import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { setCookie } from 'hono/cookie'
import { sql } from 'kysely'
import { COOKIE_OPT, ERROR_CODE } from '../constants'
import { getDb } from '../db'
import { getRefererOrThrow, refererRedirect } from '../response/post'
import { NAME_PATTERN, COMMENT_MAX, COMMENT_NAME_COOKIE, getName } from './common'

export const post = new Hono<{ Bindings: Env }>()

post.post('/', async (c) => {
  getRefererOrThrow(c)
  const form = await c.req.formData()
  const comment = String(form.get('comment') ?? '')
    .normalize('NFC')
    .trim()
  if (comment === '' || comment.length > COMMENT_MAX) throw new HTTPException(ERROR_CODE.BAD_REQUEST)

  const db = getDb(c.env.DB)
  await sql`INSERT INTO comments (name, comment) VALUES (${getName(c)}, ${comment})`.execute(db)

  return refererRedirect(c)
})

post.post('/rename', async (c) => {
  getRefererOrThrow(c)
  const form = await c.req.formData()
  const name = String(form.get('rename') ?? '')
    .normalize('NFC')
    .trim()
  if (!NAME_PATTERN.test(name)) throw new HTTPException(ERROR_CODE.BAD_REQUEST)

  setCookie(c, COMMENT_NAME_COOKIE, name, COOKIE_OPT)
  return refererRedirect(c)
})
