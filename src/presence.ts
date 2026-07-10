import { DurableObject } from 'cloudflare:workers'
import { SECOND_MS } from './constants'

export class Presence extends DurableObject {
  lastHeartbeat = new Map<string, number>()

  heartbeat(uuid: string, now: Date): number {
    this.lastHeartbeat.set(uuid, now.getTime())
    return this.countAlive(now)
  }

  peek(now: Date): number {
    return this.countAlive(now)
  }

  private countAlive(now: Date): number {
    let alive = 0
    for (const [id, t] of this.lastHeartbeat) {
      if (t >= now.getTime() - 10 * SECOND_MS) alive++
      else this.lastHeartbeat.delete(id)
    }
    return alive
  }
}
