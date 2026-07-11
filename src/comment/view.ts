import { Hono } from 'hono'
import { sql } from 'kysely'
import { getDb } from '../db'
import { getDateTimeFormatYMDhm } from '../datetime/common'
import { viewTextResponse } from '../response/view'
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
  const text = result.rows.map((row) => `${dtf.format(new Date(row.created_at))}\n${row.name}： ${row.comment}`).join('\n\n')
  return viewTextResponse(c, text)
})

view.get('/name', (c) => {
  return viewTextResponse(c, getName(c))
})
