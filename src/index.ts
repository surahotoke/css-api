import { Hono } from 'hono'
import { cookie } from './cookie'
import { heartbeat } from './heartbeat'
import { info as datetimeInfo } from './datetime/info'
import { view as datetimeView } from './datetime/view'
import { info as weatherInfo } from './weather/info'
import { view as weatherView } from './weather/view'
import { info as stockInfo } from './stock/info'
import { view as stockView } from './stock/view'
import { info as onlineCountInfo } from './online-count/info'
import { info as randomInfo } from './random/info'
import { JIG_STOCK_SYMBOL, fetchStockOpen } from './stock/common'
import home from './home.html'

const app = new Hono<{ Bindings: Env }>()
const info = new Hono<{ Bindings: Env }>()
const view = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  return c.html(home)
})

app.route('/cookie', cookie)
app.route('/heartbeat', heartbeat)

info.route('/datetime', datetimeInfo)
info.route('/weather', weatherInfo)
info.route('/stock', stockInfo)
info.route('/online-count', onlineCountInfo)
info.route('/random', randomInfo)
app.route('/info', info)

view.route('/datetime', datetimeView)
view.route('/weather', weatherView)
view.route('/stock', stockView)
app.route('/view', view)

export { Presence } from './presence'
export default {
  fetch: app.fetch,
  async scheduled(controller: ScheduledController, env: Env) {
    const now = new Date(controller.scheduledTime)
    await fetchStockOpen(env, JIG_STOCK_SYMBOL, now)
  },
} satisfies ExportedHandler<Env>
