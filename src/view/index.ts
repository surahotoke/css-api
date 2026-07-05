import { Hono } from 'hono'
import { datetime } from './datetime'
import { weather } from './weather'

export const view = new Hono<{ Bindings: Env }>()

view.route('/datetime', datetime)
view.route('/weather', weather)
