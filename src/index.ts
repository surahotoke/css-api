import { Hono } from 'hono'
import { cookie } from './cookie'
import { heartbeat } from './heartbeat'
import { info } from './info'
import { view } from './view'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  c.header('content-type', 'image/svg+xml')
  c.header('cache-control', 'no-store')
  return c.body('<svg xmlns="http://www.w3.org/2000/svg" width="123" height="456"></svg>')
})

app.route('/cookie', cookie)
app.route('/heartbeat', heartbeat)
app.route('/info', info)
app.route('/view', view)

export { Presence } from './presence'
export default app
