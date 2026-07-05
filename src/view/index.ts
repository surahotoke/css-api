import { Hono } from 'hono'
import { datetime } from './datetime'
import { weather } from './weather'
import { stock } from './stock'

export const view = new Hono<{ Bindings: Env }>()

view.route('/datetime', datetime)
view.route('/weather', weather)
view.route('/stock', stock)
