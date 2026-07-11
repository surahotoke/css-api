import { Kysely } from 'kysely'
import { D1Dialect } from 'kysely-d1'

export function getDb(database: D1Database): Kysely<any> {
  return new Kysely({ dialect: new D1Dialect({ database }) })
}
