import { Hono } from 'hono'
import { datetime } from './datetime'
import { weather } from './weather'
import { onlineCount } from './online-count'
import { random } from './random'

export const info = new Hono<{ Bindings: Env }>()

info.route('/datetime', datetime)
info.route('/weather', weather)
info.route('/online-count', onlineCount)
info.route('/random', random)
