import { Hono } from 'hono'
import { ENV } from './common'
import { viewValueResponse, infoNumberResponse, infoListIncludesResponse, infoListIndexResponse, viewListAtResponse } from './response'

/** env 空間（サービス管理 cookie）の読み取り専用 API */
export const env = new Hono<{ Bindings: Env }>()

env.get('/view/:name', (c) => viewValueResponse(c, ENV))
env.get('/number/get/:name', (c) => infoNumberResponse(c, ENV))
env.get('/list/includes/:name', (c) => infoListIncludesResponse(c, ENV))
env.get('/list/index/:name', (c) => infoListIndexResponse(c, ENV))
env.get('/list/at/:name', (c) => viewListAtResponse(c, ENV))
