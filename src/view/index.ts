import { Hono } from 'hono'
import { datetime } from './datetime'

export const view = new Hono<{ Bindings: Env }>()

view.route('/datetime', datetime)
