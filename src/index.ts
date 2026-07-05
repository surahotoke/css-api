import { Hono } from 'hono'
import { cookie } from './cookie'
import { heartbeat } from './heartbeat'
import { info } from './info'
import { view } from './view'
import { JIG_STOCK_SYMBOL, fetchStockOpen } from './stock'
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
export default {
  fetch: app.fetch,
  async scheduled(controller: ScheduledController, env: Env) {
    const now = new Date(controller.scheduledTime)
    await fetchStockOpen(env, JIG_STOCK_SYMBOL, now)
  },
} satisfies ExportedHandler<Env>
