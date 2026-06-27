import { DurableObject } from 'cloudflare:workers'
import { SECOND_MS } from './constants'

export class Presence extends DurableObject {
  lastHeartbeat = new Map<string, number>()

  heartbeat(uuid: string, now: number): number {
    this.lastHeartbeat.set(uuid, now)
    return this.countAlive(now)
  }

  peek(now: number): number {
    return this.countAlive(now)
  }

  private countAlive(now: number): number {
    let alive = 0
    for (const [id, t] of this.lastHeartbeat) {
      if (t >= now - 10 * SECOND_MS) alive++
      else this.lastHeartbeat.delete(id)
    }
    return alive
  }
}
