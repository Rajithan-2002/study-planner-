import { PlatformEvents } from '../types'

type EventCallback = (payload: any) => void | Promise<void>

class EventBus {
  private listeners: Map<PlatformEvents, EventCallback[]> = new Map()

  subscribe(event: PlatformEvents, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
    return () => this.unsubscribe(event, callback)
  }

  unsubscribe(event: PlatformEvents, callback: EventCallback) {
    const list = this.listeners.get(event)
    if (list) {
      this.listeners.set(event, list.filter(cb => cb !== callback))
    }
  }

  async publish(event: PlatformEvents, payload: any) {
    const list = this.listeners.get(event)
    if (list) {
      await Promise.all(list.map(async cb => {
        try {
          await cb(payload)
        } catch (err) {
          console.error(`Error in event handler for ${event}:`, err)
        }
      }))
    }
  }
}

export const eventBus = new EventBus()
export default eventBus
