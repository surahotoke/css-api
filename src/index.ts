import { Hono } from 'hono'
import { cookie } from './cookie'
import { heartbeat } from './heartbeat'
import { info } from './info'
import { view } from './view'
import home from './home.html'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  return c.html(home)
})

app.route('/cookie', cookie)
app.route('/heartbeat', heartbeat)
app.route('/info', info)
app.route('/view', view)

export { Presence } from './presence'
export default app
