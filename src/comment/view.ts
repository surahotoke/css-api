import { Hono } from 'hono'
import { sql } from 'kysely'
import { getDb } from '../db'
import { getDateTimeFormatYMDhm } from '../datetime/common'
import { viewTextResponse } from '../response/view'
import { viewCommentResponse } from './response'
import { LIST_LIMIT, getName } from './common'

export const view = new Hono<{ Bindings: Env }>()

view.get('/list', async (c) => {
  const db = getDb(c.env.DB)
  const result = await sql<{ name: string; comment: string; created_at: string }>`
    SELECT name, comment, created_at
    FROM comments
    ORDER BY id DESC
    LIMIT ${LIST_LIMIT}
  `.execute(db)
  const dtf = getDateTimeFormatYMDhm(c)
  const rows = result.rows.map((row) => ({
    name: row.name,
    comment: row.comment,
    createdAt: dtf.format(new Date(row.created_at)),
  }))
  return viewCommentResponse(c, rows)
})

view.get('/name', (c) => {
  return viewTextResponse(c, getName(c))
})
